import MessageSender = chrome.runtime.MessageSender;

interface Config {
    [key: string]: any;

    removeFromGroupOnDomainChange?: boolean;
}


type MessageType = 'updateConfig' | 'someOtherAction';

interface Message<T = any> {
    type: MessageType;
    payload?: T; // Define your payload structure based on the message type
}

// Configuration object to hold settings from the popup UI
let config: Config = {
    removeFromGroupOnDomainChange: true
};
// Save the configuration to chrome.storage for persistence across sessions
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({config}, () => {
        console.log('Default configuration saved to storage');
    });
});

// Load persisted configuration when the extension starts
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get('config', (data) => {
        if (data.config) {
            config = data.config;
            console.log('Configuration loaded from storage:', config);
        }
    });
});

// A utility function to update the configuration, debounced for efficiency
const updateConfig = debounce(async (newConfig: Config) => {
    config = {...config, ...newConfig};
    console.log('Configuration Updated:', config);

    try {
        // Persist config to chrome.storage for persistence across sessions
        await chrome.storage.local.set({config});
        console.log('Configuration saved to storage');
    } catch (error) {
        console.error('Failed to save configuration:', error);
    }
}, 200); // Adjust the debounce delay as needed

// Message Listener to handle messages from the popup UI
chrome.runtime.onMessage.addListener(
    (message: Message, _sender: MessageSender, sendResponse: (response: { status: string }) => void) => {
        if (message.type === 'updateConfig' && message.payload) {
            updateConfig(message.payload);
            sendResponse({status: 'success'});
        } else if (message.type === 'someOtherAction') {
            // Handle other actions here
            sendResponse({status: 'handled'}); // Example response
        } else {
            sendResponse({status: 'unknown action'});
        }

        return true; // Keep the message channel open for asynchronous responses
    }
);

// Debounce utility function to throttle rapid successive calls
function debounce<T extends (...args: any[]) => Promise<void> | void>(func: T, wait: number) {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}


chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete' || !tab.url) return;

    if (config.removeFromGroupOnDomainChange && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        try {
            const group = await chrome.tabGroups.get(tab.groupId);
            if ((new URL(tab.url).hostname) !== group.title) {
                await chrome.tabs.ungroup(tabId);
                await chrome.tabGroups.update(tab.groupId, { collapsed: true });
                await groupTabs(tab);
            }
        } catch (error) {
            console.error('Error managing tab group:', error);
        }
    } else if (tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
        await groupTabs(tab);
    }
});


async function groupTabs(tab: chrome.tabs.Tab) {
    if (tab.url) {
        const url = new URL(tab.url);
        const domain = url.hostname;

        try {
            chrome.tabs.query({url: `*://*.${domain}/*`}, (existingTabs) => {
                if (existingTabs.length > 1) {
                    const tabIds: number[] = [];
                    let groupId: number | undefined = undefined;

                    existingTabs.forEach(t => {
                        if (t.id !== undefined) {
                            tabIds.push(t.id);
                            if (groupId === undefined) {
                                groupId = t.groupId;
                            }
                        }
                    });

                    if (groupId !== undefined && groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
                        // if (tabIds.includes(tab.id!)) {
                        chrome.tabs.group({tabIds, groupId}, (group) => {
                            chrome.tabGroups.update(group, {title: domain, collapsed: false});
                        });
                        // }
                    } else {
                        chrome.tabs.group({tabIds}, (group) => {
                            chrome.tabGroups.update(group, {title: domain, collapsed: false});
                        });
                    }
                }
            });
        } catch (error) {
            console.error('Error grouping tabs:', error);
        }
    }
}

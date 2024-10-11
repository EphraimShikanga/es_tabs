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

// Cache for domain -> groupId mapping
const domainGroupMap: { [domain: string]: number } = {};

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

// Function to validate configuration
function validateConfig(newConfig: Config): boolean {
    if (typeof newConfig.removeFromGroupOnDomainChange !== 'boolean') {
        console.error('Invalid config: removeFromGroupOnDomainChange should be a boolean');
        return false;
    }
    return true;
}

// A utility function to update the configuration, debounced for efficiency
const updateConfig = debounce(async (newConfig: Config) => {
    if (!validateConfig(newConfig)) return;

    config = {...config, ...newConfig};
    console.log('Configuration Updated:', config);

    try {
        await chrome.storage.local.set({config});
        console.log('Configuration saved to storage');
    } catch (error) {
        console.error('Failed to save configuration:', error);
    }
}, 200);


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
                await chrome.tabGroups.update(tab.groupId, {collapsed: true});
                await groupTabs(tab);
            }
        } catch (error) {
            console.error('Error managing tab group:', error);
        }
    } else if (tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
        await groupTabs(tab);
    }
});


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        debouncedTabUpdate(tabId, tab);
    }
});


const debouncedTabUpdate = debounce(async (tabId: number, tab: chrome.tabs.Tab) => {
    try {
        if (config.removeFromGroupOnDomainChange && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
            const group = await chrome.tabGroups.get(tab.groupId);
            const tabDomain = new URL(tab.url!).hostname;
            if (tabDomain !== group.title) {
                await Promise.all([
                    chrome.tabs.ungroup(tabId),
                    chrome.tabGroups.update(group.id, {collapsed: true}),
                    groupTabs(tab)
                ]);
            }
        } else if (tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
            await groupTabs(tab);
        }
    } catch (error) {
        console.error(`Error processing tab ${tabId} (URL: ${tab.url}):`, error);
    }
}, 200);


async function groupTabs(tab: chrome.tabs.Tab) {
    if (tab.url) {
        const url = new URL(tab.url);
        const domain = url.hostname;

        if (domainGroupMap[domain]) {
            const groupId = domainGroupMap[domain];
            chrome.tabs.group({tabIds: [tab.id!], groupId}, async (group) => {
                await chrome.tabGroups.update(group, {title: domain, collapsed: false});
            });
        } else {
            try {
                chrome.tabs.query({url: `*://*.${domain}/*`}, (existingTabs) => {
                    if (existingTabs.length > 1) {
                        const tabIds = existingTabs.map(t => t.id).filter(id => id !== undefined) as number[];
                        chrome.tabs.group({tabIds}, async (group) => {
                            domainGroupMap[domain] = group; // Cache the new groupId
                            await chrome.tabGroups.update(group, {title: domain, collapsed: false});
                        });
                    }
                });
            } catch (error) {
                console.error('Error grouping tabs:', error);
            }
        }
    }
}


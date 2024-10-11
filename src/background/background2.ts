// Define types for configuration and messages
import MessageSender = chrome.runtime.MessageSender;

interface Config {
    [key: string]: any; // Define your specific config properties here
}

type MessageType = 'updateConfig' | 'someOtherAction';

interface Message<T = any> {
    type: MessageType;
    payload?: T; // Define your payload structure based on the message type
}

// Configuration object to hold settings from the popup UI
let config: Config = {};

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

// Load persisted configuration when the extension starts
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get('config', (data) => {
        if (data.config) {
            config = data.config;
            console.log('Configuration loaded from storage:', config);
        }
    });
});

chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete') {
            await groupTabs(tab)
        }
    }
);

async function groupTabs(tab: chrome.tabs.Tab) {
    console.log("ephraim");
    if (tab.url) {
        const url = new URL(tab.url);
        const domain = url.hostname;
        console.log(domain, url);
        chrome.tabs.query({url: `*://*.${domain}/*`}, async (existingTabs) => {
            if (existingTabs.length > 1) {
                const tabIds = existingTabs.map(t => t.id).filter((id): id is number => id !== undefined);
                const groupId = existingTabs[0].groupId;
                if (groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
                    chrome.tabs.group({tabIds, groupId}, async (group) => {
                        if (tabIds.includes(tab.id!)) {
                            await chrome.tabGroups.update(group, {title: domain, collapsed: false});
                        } else {
                            await chrome.tabGroups.update(group, {title: domain, collapsed: true});
                        }
                    });
                } else {
                    chrome.tabs.group({tabIds}, async (group) => {
                        await chrome.tabGroups.update(group, {title: domain, collapsed: false});
                    });
                }
            }
        });
    }
}
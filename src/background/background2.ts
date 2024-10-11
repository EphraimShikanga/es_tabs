import {sleep, debounce, validateConfig, Config, Message, domainGroupMap} from "@/background/utils.ts";
import MessageSender = chrome.runtime.MessageSender;

// Configuration object to hold settings from the popup UI
let config: Config = {
    removeFromGroupOnDomainChange: true
};
let currentExpandedGroupId: number | null = null;

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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        debouncedTabUpdate(tabId, tab);
    }
});

// Event: Collapse all groups when a new tab is created
chrome.tabs.onCreated.addListener(async () => {
    await collapseAllGroups();
});

// Collapse all groups
async function collapseAllGroups() {
    const groups = await chrome.tabGroups.query({ collapsed: false });
    await Promise.all(groups.map(group => chrome.tabGroups.update(group.id, { collapsed: true })));
}

// Event: Collapse the current group when another group or tab outside it is clicked
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const activeTab = await chrome.tabs.get(activeInfo.tabId);
    let delay = 500;
    try {
        if (activeTab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE && activeTab.groupId !== currentExpandedGroupId) {
            if (currentExpandedGroupId !== null) {
                await sleep(delay);
                await chrome.tabGroups.update(currentExpandedGroupId, {collapsed: true});
            }

            await sleep(delay);
            await chrome.tabGroups.update(activeTab.groupId, {collapsed: false});
            currentExpandedGroupId = activeTab.groupId;
        } else if (activeTab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE && currentExpandedGroupId !== null) {
            await sleep(delay);
            await chrome.tabGroups.update(currentExpandedGroupId, {collapsed: true});
            currentExpandedGroupId = null;
        }
    } catch (error) {
        console.error(`Error updating tab groups, retrying with more delay`, error);
        if (currentExpandedGroupId !== null) {
            delay += 200;
            await sleep(delay);
            await chrome.tabGroups.update(currentExpandedGroupId, {collapsed: true});  // Retry collapsing after increased delay
        }
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
                currentExpandedGroupId = group;
                await chrome.tabGroups.update(group, {title: domain, collapsed: false});
            });
        } else {
            try {
                chrome.tabs.query({url: `*://*.${domain}/*`}, (existingTabs) => {
                    if (existingTabs.length > 1) {
                        const tabIds = existingTabs.map(t => t.id).filter(id => id !== undefined) as number[];
                        chrome.tabs.group({tabIds}, async (group) => {
                            domainGroupMap[domain] = group;
                            currentExpandedGroupId = group;
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


import {
    checkIrrelevantTabs,
    collapseAllGroups,
    Config,
    debounce,
    domainGroupMap,
    Message,
    sleep,
    startInactivityTimer,
    stopInactivityTimer,
    tabGroupMap,
    validateConfig
} from "@/background/utils.ts";
import MessageSender = chrome.runtime.MessageSender;

// Configuration object to hold settings from the popup UI
let config: Config = {
    removeFromGroupOnDomainChange: true,
    hibernationTime: 30000
};
let currentExpandedGroupId: number | null = null;
let tabCreationBuffer: chrome.tabs.Tab[] = [];
let isProcessingBuffer = false;

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
    (message: Message, _sender: MessageSender, sendResponse) => {
        if (message.type === 'updateConfig' && message.payload) {
            updateConfig(message.payload);
            sendResponse({status: 'success'});
        } else if (message.type === 'fetchTabs') {
            chrome.tabs.query({}, (tabs) => {
                const relevantTabs = tabs.filter(tab => !checkIrrelevantTabs(tab));
                console.log(relevantTabs);
                sendResponse({ tabs: relevantTabs });
            });
        } else {
            sendResponse({status: 'unknown action'});
        }

        return true; // Keep the message channel open for asynchronous responses
    }
);

// Buffering tabs for batch processing and collapsing all groups when a new tab is created
chrome.tabs.onCreated.addListener(async (tab) => {
    tabCreationBuffer.push(tab);

    if (!isProcessingBuffer) {
        isProcessingBuffer = true;
        setTimeout(async () => {
            const bufferCopy = [...tabCreationBuffer];
            tabCreationBuffer = [];
            await processTabBatch(bufferCopy);
        }, 500); // Adjust delay as needed
    }
    await collapseAllGroups();
    startInactivityTimer(tab.id!, config.hibernationTime);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        debouncedTabUpdate(tabId, tab);
        startInactivityTimer(tabId, config.hibernationTime);
    }
});

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
    startInactivityTimer(activeInfo.tabId, config.hibernationTime);
});


// Process tabs in bulk when multiple tabs are created at once
async function processTabBatch(tabs: chrome.tabs.Tab[]) {
    try {
        for (const tab of tabs) {
            if (tab.url) {
                await groupTabs(tab);
            }
        }
    } catch (error) {
        console.error('Error processing tab batch:', error);
    } finally {
        isProcessingBuffer = false;
    }
}

// Monitor when a group is deleted and reset currentExpandedGroupId if it was the expanded group
chrome.tabGroups.onRemoved.addListener(async (group) => {
    if (group.id === currentExpandedGroupId) {
        console.log(`Currently expanded group ${group.id} was deleted, resetting currentExpandedGroupId.`);
        currentExpandedGroupId = null;
    }
    for (const domain in domainGroupMap) {
        if (domainGroupMap[domain] === group.id) {
            delete domainGroupMap[domain];
        }
    }

    // Delete all keys in tabGroupMap whose values are the group.id
    for (const tabId in tabGroupMap) {
        if (tabGroupMap[tabId] === group.id) {
            delete tabGroupMap[tabId];
        }
    }
});

// Monitor when a tab is ungrouped and reset currentExpandedGroupId if it was the expanded group
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
        delete tabGroupMap[tabId];
    }
    if (tabGroupMap[tabId] !== changeInfo.groupId) {
        delete tabGroupMap[tabId];
    }

});

// Monitor when tabs are removed and check if their group has only one tab left
chrome.tabs.onRemoved.addListener(async (tabId) => {
    const group = tabGroupMap[tabId];
    if (group) {
        const tabs = await chrome.tabs.query({groupId: group});
        if (tabs.length === 1) {
            await chrome.tabs.ungroup(tabs[0].id!);
            delete domainGroupMap[new URL(tabs[0].url!).hostname];
        }
    }
    delete tabGroupMap[tabId];
    stopInactivityTimer(tabId);
});


const debouncedTabUpdate = debounce(async (tabId: number, tab: chrome.tabs.Tab) => {
    try {
        if (config.removeFromGroupOnDomainChange && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
            const group = await chrome.tabGroups.get(tab.groupId).catch(() => null);
            if (!group) {
                console.log(`Group with ID ${tab.groupId} no longer exists.`);
                return;
            }
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
            const group = await chrome.tabGroups.get(groupId).catch(() => null);
            if (!group) {
                console.log(`Group with ID ${groupId} no longer exists.`);
                delete domainGroupMap[domain];
                return;
            }
            chrome.tabs.group({tabIds: [tab.id!], groupId}, async (group) => {
                currentExpandedGroupId = group;
                tabGroupMap[tab.id!] = group;
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
                            tabGroupMap[tab.id!] = group;
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


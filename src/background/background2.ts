import {
    checkIrrelevantTabs, ClosedTabs,
    collapseAllGroups,
    Config,
    debounce,
    defaultTab,
    domainGroupMap, getDomainColor,
    Message,
    sleep,
    startInactivityTimer,
    stopInactivityTimer,
    tabGroupMap,
    validateConfig,
    Workspace,
    Workspaces
} from "@/background/utils.ts";
import MessageSender = chrome.runtime.MessageSender;
import ColorEnum = chrome.tabGroups.ColorEnum;

// Configuration object to hold settings from the popup UI
let config: Config = {
    removeFromGroupOnDomainChange: true,
    hibernationTime: 20000,
    lastAccessedThreshold: 600000
};
const closedTabsStorage: ClosedTabs = {};
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

// let spaces: Workspace[] = [];

let spaces: Workspaces = {}

let currentSpace: Workspace = {
    id: 0,
    title: "",
    tabs: [],
    groups: [],
    isCurrent: false,
};
// const lastActiveWorkspaceId: number = 1;

// Load persisted configuration when the extension starts
chrome.runtime.onStartup.addListener(async () => {
    chrome.storage.local.get('config', (data) => {
        if (data.config) {
            config = data.config;
            console.log('Configuration loaded from storage:', config);
        }
    });

    try {
        chrome.storage.local.get(['workspaces', 'lastActiveWorkspaceId'], async (data) => {
            if (data.workspaces && data.lastActiveWorkspaceId) {
                spaces = data.workspaces;
                currentSpace = spaces[data.lastActiveWorkspaceId];
                console.log('Workspaces loaded from storage:', spaces, 'Current workspace:', currentSpace);
            } else {
                console.log('No workspaces found in storage, initializing with default workspace');
                spaces = {
                    1: {
                        id: 1,
                        title: 'Default',
                        tabs: [],
                        groups: [],
                        isCurrent: true
                    }
                };
                currentSpace = spaces[1];
                await chrome.storage.local.set({workspaces: spaces, lastActiveWorkspaceId: 1});
            }
        });
    } catch (error) {
        console.error('Error loading last active workspace:', error);
    }
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
                sendResponse({tabs: relevantTabs});
            });
        } else if (message.type === 'fetchWorkspaces') {
            console.log("sending current workspace: ", currentSpace, " and all workspaces: ", spaces);
            sendResponse({
                workspaces: spaces, currentWorkspace: {
                    ...currentSpace,
                    tabs: currentSpace.tabs.filter(tab => !checkIrrelevantTabs(tab))
                }
            });
        } else if (message.type === 'createNewWorkspace' && message.payload) {
            createWorkspace(message.payload).then(() => {
                sendResponse({status: 'success'});
            });
        } else if (message.type === 'switchWorkspace' && message.payload) {
            switchWorkspace(message.payload).then(() => {
                sendResponse({status: 'success'});
            });
        } else if (message.type === 'deleteWorkspace' && message.payload) {
            deleteWorkspace(message.payload).then(() => {
                sendResponse({status: 'success'});
            });
        }

        return true; // Keep the message channel open for asynchronous responses
    }
);

async function deleteWorkspace(workspaceId: number) {
    try {
        const workspace = spaces[workspaceId];
        if (workspace) {
            const lastActiveWorkspace = workspaceId === currentSpace.id;
            let newActiveWorkspace;
            if (lastActiveWorkspace) {
                newActiveWorkspace = spaces[1];
            }
            delete spaces[workspaceId];
            if (newActiveWorkspace) {
                newActiveWorkspace.isCurrent = true;
                currentSpace.tabs.forEach((tab) => chrome.tabs.remove(tab.id!));
                currentSpace = newActiveWorkspace;
                await loadWorkspaceTabs(newActiveWorkspace);
                await chrome.storage.local.set({lastActiveWorkspaceId: newActiveWorkspace.id});
            }
            await chrome.storage.local.set({workspaces: spaces});
        }

    } catch (error) {
        console.error('Error deleting workspace:', error);
    }
}


async function createWorkspace(title: string) {
    try {
        const id = Math.floor(Math.random() * 1000);
        const tabs: chrome.tabs.Tab[] = [];
        if (title === "Default") {
            tabs.push(defaultTab);
        }
        const workspace: Workspace = {
            id: id,
            title,
            tabs: tabs,
            groups: [],
            isCurrent: false
        };
        spaces[id] = workspace;
        await switchWorkspace(workspace);
        console.log('Workspace created:', workspace, 'All workspaces:', spaces, 'Current workspace:', currentSpace);

    } catch (e) {
        console.error('Error creating workspace:', e);
    }
}

async function switchWorkspace(workspace: Workspace) {
    try {
        // Save and close current workspace tabs
        const lastActiveWorkspace = currentSpace;
        lastActiveWorkspace.isCurrent = false;
        lastActiveWorkspace.tabs = await chrome.tabs.query({});

        // Close tabs only from the last active workspace
        const tabIdsToRemove = lastActiveWorkspace.tabs.map((tab) => tab.id).filter((id): id is number => id !== undefined);

        // Update and load new workspace
        currentSpace = workspace;
        currentSpace.isCurrent = true;
        await loadWorkspaceTabs(currentSpace);

        spaces[currentSpace.id] = currentSpace;
        spaces[lastActiveWorkspace.id] = lastActiveWorkspace;

        await chrome.storage.local.set({
            workspaces: spaces,
            lastActiveWorkspaceId: currentSpace.id
        });
        await chrome.tabs.remove(tabIdsToRemove);

        console.log('Switched to workspace:', currentSpace);
    } catch (error) {
        console.error('Error switching workspace:', error);
    }
}

async function loadWorkspaceTabs(workspace: Workspace) {
    try {
        if (workspace.tabs.length === 0) {
            await chrome.tabs.create({"url": "chrome://newtab", active: true});
        }
        for (const tab of workspace.tabs) {
            await chrome.tabs.create({
                url: tab.url,
                active: false
            });
        }
        currentSpace.tabs = await chrome.tabs.query({});
        currentSpace.groups = await chrome.tabGroups.query({});
        console.log('Loaded tabs for workspace:', workspace.title);
    } catch (error) {
        console.error('Error loading workspace tabs:', error);
    }
}



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
    startInactivityTimer(tab.id!, config.hibernationTime!);
});

chrome.tabs.onReplaced.addListener(async (addedTabId, removedTabId) => {
    currentSpace.tabs = currentSpace.tabs.filter((tab) => tab.id !== removedTabId);
    const tab = await chrome.tabs.get(addedTabId);
    currentSpace.tabs.push(tab);
    currentSpace.groups = await chrome.tabGroups.query({});
    delete tabGroupMap[removedTabId];
    tabGroupMap[addedTabId] = tab.groupId!;
    stopInactivityTimer(removedTabId);
    startInactivityTimer(addedTabId, config.hibernationTime);
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
    currentSpace.tabs = await chrome.tabs.query({});
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

chrome.tabs.onUpdated.addListener( async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        debouncedTabUpdate(tabId, tab);
        currentSpace.tabs = currentSpace.tabs.filter((tab) => tab.id !== tabId);
        currentSpace.tabs.push(tab);
        currentSpace.groups = currentSpace.groups.filter((group) => group.id !== tab.groupId);
        currentSpace.groups = await chrome.tabGroups.query({})
        startInactivityTimer(tabId, config.hibernationTime);
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
    currentSpace.tabs = currentSpace.tabs.filter((tab) => tab.id !== tabId);
    console.log("removed tab: ", tabId, "from: ", currentSpace.tabs);
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

// Monitor when a group is deleted and reset currentExpandedGroupId if it was the expanded group
chrome.tabGroups.onRemoved.addListener(async (group) => {
    if (group.id === currentExpandedGroupId) {
        console.log(`Currently expanded group ${group.id} was deleted, resetting currentExpandedGroupId.`);
        currentExpandedGroupId = null;
    }
    currentSpace.groups = currentSpace.groups.filter((grp) => grp.id !== group.id);

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
                chrome.tabGroups.update(group, {title: domain, collapsed: false, color: (await getDomainColor(domain) as ColorEnum)}, (group) => {
                    currentSpace.groups.push(group);
                });
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
                            chrome.tabGroups.update(group, {title: domain, collapsed: false, color: (await getDomainColor(domain) as ColorEnum)}, (group) => {
                                currentSpace.groups.push(group);
                            });
                        });
                    }
                });
            } catch (error) {
                console.error('Error grouping tabs:', error);
            }
        }
    }
}

async function checkTabsForInactivity(threshold: number) {
    console.log("Starting inactivity check");
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
        if (!tab.active) {
            const elapsedTime = Date.now() - tab.lastAccessed!;
            console.log("lastAccessed", elapsedTime);
            if (elapsedTime > threshold) {
                chrome.tabs.remove(tab.id!, () => {
                    closedTabsStorage[tab.id!] = tab;
                    currentSpace.tabs.filter(t => t.id !== tab.id);
                });
            }
        }
    }
}

setInterval(async () => {
    await checkTabsForInactivity(config.lastAccessedThreshold!);
}, 30000);
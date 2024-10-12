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
    validateConfig,
    Workspace
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
    chrome.storage.local.set({workspaces: [currentSpace], lastActiveWorkspaceId: lastActiveWorkspaceId }, () => {
        console.log('Default workspaces saved to storage');
    });
});

let spaces: Workspace[] = [];
let currentSpace: Workspace = {
    id: 1,
    title: "Default",
    tabs: [],
    groups: [],
    isCurrent: true,
};
const lastActiveWorkspaceId: number = 1;

// Load persisted configuration when the extension starts
chrome.runtime.onStartup.addListener(async () => {
    chrome.storage.local.get('config', (data) => {
        if (data.config) {
            config = data.config;
            console.log('Configuration loaded from storage:', config);
        }
    });

    try {
        const {
            lastActiveWorkspaceId,
            workspaces
        } = await chrome.storage.local.get(['lastActiveWorkspaceId', 'workspaces']);

        if (lastActiveWorkspaceId && workspaces) {
            const lastWorkspace = workspaces.find((workspace: Workspace) => workspace.id === lastActiveWorkspaceId);
            spaces = workspaces;

            if (lastWorkspace) {
                await loadWorkspaceTabs(lastWorkspace);
                currentSpace = lastWorkspace;
                console.log('Loaded last active workspace:', lastWorkspace);
            } else {
                console.log('Last active workspace not found.');
            }
        } else {
            console.log('No last active workspace ID or workspaces found.');
        }
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
                console.log(relevantTabs);
                sendResponse({tabs: relevantTabs});
            });
        } else if (message.type === 'fetchWorkspaces') {
            sendResponse({workspaces: spaces});
        }
        else if (message.type === 'createNewWorkspace' && message.payload) {
            createWorkspace(message.payload).then(() => {
                sendResponse({status: 'success'});
            });
        }else if (message.type === 'switchWorkspace' && message.payload) {
            switchWorkspace(message.payload).then(() => {
                sendResponse({status: 'success'});
            });
        }

        return true; // Keep the message channel open for asynchronous responses
    }
);


async function createWorkspace(title: string) {
    try {
        const newId = Math.floor(Math.random() * 1000000);
        const newWorkspace: Workspace = {
            id: newId,
            title,
            tabs: [await chrome.tabs.create({url: 'chrome://newtab'})],
            groups: [],
            isCurrent: true
        };
        const lastActiveWorkspace = {
            ...currentSpace,
            isCurrent: false
        };
        spaces = spaces.map((workspace: Workspace) => {
            if (workspace.id === lastActiveWorkspace.id) {
                return lastActiveWorkspace;
            } else {
                return workspace;
            }
        });
        spaces.push(newWorkspace);
        currentSpace = newWorkspace;
        lastActiveWorkspace.tabs.forEach((tab) => chrome.tabs.remove(tab.id!));
        // await chrome.tabs.create({url: 'chrome://newtab'});
        await chrome.storage.local.set({lastActiveWorkspaceId: newId});
        await chrome.storage.local.set({workspaces: spaces});
    } catch (e) {
        console.error('Error creating workspace:', e);
    }
}

async function switchWorkspace(workspaceId: number) {
    try {
        const currentWorkspace = spaces.find((workspace: Workspace) => workspace.id === workspaceId);
        let lastActiveWorkspace = spaces.find((workspace: Workspace) => workspace.isCurrent);

        if (currentWorkspace && lastActiveWorkspace) {
            currentSpace = {...currentWorkspace, isCurrent: true};
            lastActiveWorkspace = {
                ...lastActiveWorkspace,
                tabs: await chrome.tabs.query({}),
                groups: await chrome.tabGroups.query({}),
                isCurrent: false
            };

            spaces = spaces.map((workspace: Workspace) => {
                if (workspace) {
                    if (workspace.id === currentWorkspace.id) {
                        return currentSpace;
                    } else if (workspace.id === lastActiveWorkspace!.id) {
                        return lastActiveWorkspace;
                    } else {
                        return workspace;
                    }
                }
            }).filter((workspace): workspace is Workspace => workspace !== undefined);

            // Save the current workspace ID to storage
            await chrome.storage.local.set({lastActiveWorkspaceId: workspaceId});
            await chrome.storage.local.set({workspaces: spaces});
            console.log('Switched to workspace:', currentWorkspace);

            // Load the tabs and groups for the current workspace
            lastActiveWorkspace.tabs.forEach((tab) => chrome.tabs.remove(tab.id!));
            await loadWorkspaceTabs(currentWorkspace);
        }
    } catch (error) {
        console.error('Error switching workspace:', error);
    }
}

async function loadWorkspaceTabs(workspace: Workspace) {
    for (const tab of workspace.tabs) {
        await chrome.tabs.create({url: tab.url});
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
    startInactivityTimer(tab.id!, config.hibernationTime);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        debouncedTabUpdate(tabId, tab);
        currentSpace.tabs = currentSpace.tabs.filter((tab) => tab.id !== tabId);
        currentSpace.tabs.push(tab);
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
    currentSpace.tabs = currentSpace.tabs.filter((tab) => tab.id !== tabId);
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
            chrome.tabs.group({tabIds: [tab.id!], groupId}, (group) => {
                currentExpandedGroupId = group;
                tabGroupMap[tab.id!] = group;
                chrome.tabGroups.update(group, {title: domain, collapsed: false}, (group) => {
                    currentSpace.groups.push(group);
                });
            });
        } else {
            try {
                chrome.tabs.query({url: `*://*.${domain}/*`}, (existingTabs) => {
                    if (existingTabs.length > 1) {
                        const tabIds = existingTabs.map(t => t.id).filter(id => id !== undefined) as number[];
                        chrome.tabs.group({tabIds}, (group) => {
                            domainGroupMap[domain] = group;
                            currentExpandedGroupId = group;
                            tabGroupMap[tab.id!] = group;
                            chrome.tabGroups.update(group, {title: domain, collapsed: false}, (group) => {
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


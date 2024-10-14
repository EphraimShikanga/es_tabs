import {
    ClosedTabs,
    Config,
    DEBOUNCE_DELAY,
    INACTIVITY_THRESHOLD,
    tabGroupMap,
    Workspace,
    Workspaces
} from "@/background/types.ts";
import {handleMessaging, loadWorkspaces} from "@/background/workspace.ts";
import {
    checkTabsForInactivity,
    collapseAllGroups,
    debouncedTabUpdate,
    handleGroupRemoval,
    handleTabRemoval,
    processTabBatch,
    startInactivityTimer,
    updateGroups
} from "@/background/utils.ts";

// Configuration object to hold settings from the popup UI
let config: Config = {
    removeFromGroupOnDomainChange: true,
    hibernationTimeout: 20000,
    lastAccessedThreshold: 600000,
    closeTabAfterDuration: 10000,
    navigateToAlreadyOpenTab: true
};


let closedTabsStorage: ClosedTabs = {};

// Initialize the extension
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({config}).then(r => {
        console.log("Extension initialized with default configuration", r);
    });
});

let spaces: Workspaces = {}
let currentSpace: Workspace = {id: 0, title: '', tabs: {}, groups: [], isCurrent: false};


// Load persisted configuration when the extension starts
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(['config', 'workspaces', 'lastActiveWorkspaceId'], async (data) => {
        if (data.config) {
            config = data.config;
            console.log('Configuration loaded from storage:', config);
        }
        ({spaces, currentSpace} = await loadWorkspaces(data.workspaces, data.lastActiveWorkspaceId));
    });
});


// Handle messages from the popup UI
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    handleMessaging(config, message, _sender, sendResponse);
    return true;
});


// Handle tab creation
let tabCreationBuffer: chrome.tabs.Tab[] = [];
let isProcessingBuffer = false;
chrome.tabs.onCreated.addListener(async (tab) => {
    tabCreationBuffer.push(tab);
    if (!isProcessingBuffer) {
        isProcessingBuffer = true;
        setTimeout(async () => {
            const bufferCopy = [...tabCreationBuffer];
            tabCreationBuffer = [];
            isProcessingBuffer = await processTabBatch(bufferCopy, currentSpace);
        }, DEBOUNCE_DELAY);
    }
    await collapseAllGroups();
    startInactivityTimer(tab.id!, config.hibernationTimeout!);
    // await groupTabs(tab, currentSpace);
    console.log(spaces);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        debouncedTabUpdate(tabId, tab, config, currentSpace);
        if (config.navigateToAlreadyOpenTab) {
            const openedSimilarTabs = await chrome.tabs.query({url: tab.url});
            if (openedSimilarTabs.length > 1) {
                openedSimilarTabs.forEach((openedTab) => {
                    if (openedTab.id !== tabId) {
                        chrome.tabs.remove(openedTab.id!);
                    }
                });
            }
            await chrome.tabs.update(tabId, {active: true});
        }
        // console.log("After", currentSpace);

        currentSpace.tabs[tabId] = {id: tabId, tab: tab};
        currentSpace.groups = await chrome.tabGroups.query({})
        startInactivityTimer(tabId, config.hibernationTimeout!);
    }
});

chrome.tabs.onReplaced.addListener(async (addedTabId, removedTabId) => {
    for (const storedtab of Object.values(currentSpace.tabs)) {
        if (storedtab.id === removedTabId) {
            storedtab.id = addedTabId;
            currentSpace.tabs[addedTabId] = storedtab;
            delete currentSpace.tabs[removedTabId];
            break;
        }
    }

    if (tabGroupMap[removedTabId]) {
        tabGroupMap[addedTabId] = tabGroupMap[removedTabId];
        delete tabGroupMap[removedTabId];
    }
    // await updateGroups(addedTabId, currentSpace, config);
    // startInactivityTimer(addedTabId, config.hibernationTimeout!);
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

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    await updateGroups(activeInfo.tabId, currentSpace, config);
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
    await handleTabRemoval(tabId, currentSpace);
});


chrome.tabGroups.onRemoved.addListener(async (group) => {
    await handleGroupRemoval(group.id, currentSpace);
});

setTimeout(async () => {
    await checkTabsForInactivity(config.closeTabAfterDuration, closedTabsStorage, currentSpace);
    // await collapseAllGroups();
    // await updateGroups(-1, currentSpace, config);
    // console.log('Groups updated');
}, INACTIVITY_THRESHOLD);
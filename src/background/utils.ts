// utils for the background script

import {Config, DEBOUNCE_DELAY, domainGroupMap, tabGroupMap, Workspace} from "@/background/types.ts";
import ColorEnum = chrome.tabGroups.ColorEnum;

const availableColors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
const usedColors = new Set<string>();
const tabInactivityTimers = new Map<number, NodeJS.Timeout>();

export async function getDomainColor(domain: string): Promise<string> {
    const colors = await chrome.storage.local.get('domainColors');
    const domainColors = colors.domainColors || {};

    if (domainColors[domain]) {
        return domainColors[domain];
    }

    const unusedColors = availableColors.filter(color => !usedColors.has(color));

    if (unusedColors.length === 0) {
        usedColors.clear();
        unusedColors.push(...availableColors);
    }

    const randomColor = unusedColors[Math.floor(Math.random() * unusedColors.length)];
    usedColors.add(randomColor);

    domainColors[domain] = randomColor;
    await chrome.storage.local.set({domainColors});

    return randomColor;
}


// Utility function to sleep for a given amount of time
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Debounce utility function to throttle rapid successive calls
export function debounce<T extends (...args: any[]) => Promise<void> | void>(func: T, wait: number) {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Function to validate configuration
export function validateConfig(newConfig: Config): boolean {
    if (typeof newConfig.removeFromGroupOnDomainChange !== 'boolean') {
        console.error('Invalid config: removeFromGroupOnDomainChange should be a boolean');
        return false;
    }
    return true;
}

// Collapse all groups
export async function collapseAllGroups() {
    const groups = await chrome.tabGroups.query({collapsed: false});
    await Promise.all(groups.map(group => chrome.tabGroups.update(group.id, {collapsed: true})));
}


// Function to hibernate a tab
async function hibernateTab(tabId: number) {
    const [activeTab] = await chrome.tabs.query({active: true});
    if (activeTab && activeTab.id === tabId) {
        return;
    }
    if (tabInactivityTimers.has(tabId)) {
        clearTimeout(tabInactivityTimers.get(tabId)!);
    }
    chrome.tabs.discard(tabId, () => {
        tabInactivityTimers.delete(tabId);
    });
}

// Start or reset the inactivity timer for a tab
export function startInactivityTimer(tabId: number, inactivityLimit: number) {
    if (tabInactivityTimers.has(tabId)) {
        clearTimeout(tabInactivityTimers.get(tabId)!);
    }
    const timeout = setTimeout(() => hibernateTab(tabId), inactivityLimit);
    tabInactivityTimers.set(tabId, timeout);
}

export function stopInactivityTimer(tabId: number) {
    if (tabInactivityTimers.has(tabId)) {
        clearTimeout(tabInactivityTimers.get(tabId)!);
        tabInactivityTimers.delete(tabId);
    }
}


export function checkIrrelevantTabs(tab: chrome.tabs.Tab): boolean {
    const irrelevantPrefixes = [
        'chrome://',
        'chrome-extension://',
        'chrome-devtools://',
        'chrome-search://',
        'about:'
    ];
    return irrelevantPrefixes.some(prefix => tab.url?.startsWith(prefix));
}

export const updateConfig = debounce(async (oldConfig: Config, newConfig: Config) => {
    try {
        if (!validateConfig(newConfig)) return;
        const config = {...oldConfig, ...newConfig};
        await chrome.storage.local.set({config});
        console.log('Configuration saved to storage');
    } catch (error) {
        console.error('Failed to save configuration:', error);
    }
}, DEBOUNCE_DELAY);

// Process tabs in bulk when multiple tabs are created at once
export async function processTabBatch(tabs: chrome.tabs.Tab[], currentSpace: Workspace, currentExpandedGroupId: number | null) {
    try {
        await Promise.all(tabs.map(async (tab) => {
            if (tab.url) {
                await groupTabs(tab, currentSpace, currentExpandedGroupId);
            }
        }));
        return false
    } catch (error) {
        console.error('Error processing tab batch:', error);
    }
    return false;
}

export async function groupTabs(tab: chrome.tabs.Tab, currentSpace: Workspace, currentExpandedGroupId: number | null = null) {
    if (!tab.url) {
        console.warn('Tab does not have a valid URL.');
        return;
    }

    const url = new URL(tab.url);
    const domain = url.hostname;

    try {
        // Check if the domain is already mapped to a group
        let groupId = domainGroupMap[domain];
        let group: chrome.tabGroups.TabGroup | null = null;

        if (groupId) {
            // Attempt to retrieve the existing group
            group = await chrome.tabGroups.get(groupId).catch(() => null);

            if (!group) {
                console.log(`Group with ID ${groupId} no longer exists. Cleaning up...`);
                delete domainGroupMap[domain];
            }
        }

        // If the group doesn't exist, create or find relevant group for the domain
        if (!groupId) {
            const existingTabs = await chrome.tabs.query({url: `*://*.${domain}/*`});

            // Only group tabs if there are multiple tabs for the same domain
            if (existingTabs.length > 1) {
                const tabIds = existingTabs.map(t => t.id!).filter(id => id !== undefined);

                // Group the tabs and save the group ID
                groupId = await chrome.tabs.group({tabIds});
                domainGroupMap[domain] = groupId;
            }
        }

        // Group the current tab into the relevant group
        if (groupId) {
            const newGroupId = await chrome.tabs.group({tabIds: [tab.id!], groupId});

            // Update the group properties (title, color, etc.)
            const color = await getDomainColor(domain) as ColorEnum;
            group = await chrome.tabGroups.update(newGroupId, {
                title: domain,
                collapsed: false,
                color
            });

            // Update the tab-group maps
            tabGroupMap[tab.id!] = newGroupId;

            // Update the current workspace with the new group (ensuring immutability)
            currentExpandedGroupId = group.id;
            currentSpace.groups = [...currentSpace.groups.filter(g => g.id !== currentExpandedGroupId), group];

        }
    } catch (error) {
        console.error('Error handling tab grouping:', error);
    }
}

export const debouncedTabUpdate = debounce(async (tabId: number, tab: chrome.tabs.Tab, config: Config, currentSpace: Workspace, currentExpandedGroupId: number | null) => {
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
                    groupTabs(tab, currentSpace, currentExpandedGroupId)
                ]);
            }
        } else if (tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
            await groupTabs(tab, currentSpace, currentExpandedGroupId);
        }
    } catch (error) {
        console.error(`Error processing tab ${tabId} (URL: ${tab.url}):`, error);
    }
}, DEBOUNCE_DELAY);

export async function updateGroups(tabId: number, currentExpandedGroupId: number | null, currentSpace: Workspace, config: Config) {
    const activeTab = await chrome.tabs.get(tabId);
    let delay = DEBOUNCE_DELAY;
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
    currentSpace.tabs[tabId] = {id: tabId, tab: activeTab};
    startInactivityTimer(tabId, config.hibernationTimeout!);
}

export async function handleTabRemoval(tabId: number, currentSpace: Workspace) {
    delete currentSpace.tabs[tabId];
    const group = tabGroupMap[tabId];
    if (group) {
        const tabs = await chrome.tabs.query({groupId: group});
        if (tabs.length === 1) {
            await chrome.tabs.ungroup(tabs[0].id!);
            delete domainGroupMap[new URL(tabs[0].url!).hostname];
        }
    }
    if (tabGroupMap[tabId]) {
        delete tabGroupMap[tabId];
    }
    stopInactivityTimer(tabId);
}

export async function handleGroupRemoval(groupId: number, currentSpace: Workspace, currentExpandedGroupId: number | null) {
    const tabs = await chrome.tabs.query({groupId});
    tabs.forEach(tab => {
        delete currentSpace.tabs[tab.id!];
        if (tabGroupMap[tab.id!]) {
            delete tabGroupMap[tab.id!];
        }
    });
    delete domainGroupMap[new URL(tabs[0].url!).hostname];

    if (groupId === currentExpandedGroupId) {
        console.log(`Currently expanded group ${groupId} was deleted, resetting currentExpandedGroupId.`);
        currentExpandedGroupId = null;
    }
    currentSpace.groups = currentSpace.groups.filter((grp) => grp.id !== groupId);
}
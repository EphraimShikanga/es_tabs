// utils for the background script

type MessageType = 'updateConfig'| 'fetchConfig' | 'fetchTabs' | 'createNewWorkspace' |
    'fetchWorkspaces' | 'switchWorkspace' | 'deleteWorkspace' | 'fetchClosedTabs' |
'restoreTab';

export interface Workspace {
    id: number;
    title: string;
    tabs: chrome.tabs.Tab[];
    groups: chrome.tabGroups.TabGroup[];
    isCurrent: boolean;
}


export type Workspaces = Record<number, Workspace>;
export type ClosedTabs = Record<number, chrome.tabs.Tab>;

export function convertClosedTabsToList(closedTabs: ClosedTabs): chrome.tabs.Tab[] {
    return Object.values(closedTabs);
}

export async function restoreClosedTab(tab: chrome.tabs.Tab) {
    await chrome.tabs.create({url: tab.url});
}

export const defaultTab: chrome.tabs.Tab = {
    selected: true,
    id: -1,
    url: 'chrome://newtab/',
    title: 'New Tab',
    favIconUrl: 'tabss.webp',
    active: true,
    pinned: false,
    discarded: false,
    autoDiscardable: true,
    mutedInfo: {muted: false},
    groupId: chrome.tabGroups.TAB_GROUP_ID_NONE,
    windowId: -1,
    index: -1,
    highlighted: true,
    incognito: false
};

const availableColors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
const usedColors = new Set<string>();

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

export interface Config {
    removeFromGroupOnDomainChange: boolean,
    navigateToAlreadyOpenTab: boolean,
    autoGroupTabs: boolean,
    maxTabsPerGroup: number,
    hibernationTime: number,
    lastAccessedThreshold: number,
}

export interface Message<T = any> {
    type: MessageType;
    payload?: T; // Define your payload structure based on the message type
}

// Cache for domain -> groupId mapping
export const domainGroupMap: { [domain: string]: number } = {};
export const tabGroupMap: { [tabId: number]: number } = {};
const tabInactivityTimers = new Map<number, NodeJS.Timeout>();
// export const cachedTabs: chrome.tabs.Tab[] = [];


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
    return (newConfig.hibernationTime >= 0 && newConfig.lastAccessedThreshold >= 0 && newConfig.maxTabsPerGroup >= 0);
}

// Collapse all groups
export async function collapseAllGroups() {
    const groups = await chrome.tabGroups.query({collapsed: false});
    await Promise.all(groups.map(group => chrome.tabGroups.update(group.id, {collapsed: true})));
}


// Function to hibernate a tab
async function hibernateTab(tabId: number) {
    stopInactivityTimer(tabId);
    const tab = await chrome.tabs.get(tabId);
    if (tab.active || checkIrrelevantTabs(tab) || tab.discarded) {
        return;
    }

    chrome.tabs.discard(tabId, async () => {
        console.log("Tab hibernated", tabId);
        // tabInactivityTimers.delete(tabId);
        console.log(await chrome.tabs.query({}));
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
// Background types


export type MessageType = 'updateConfig' | 'fetchTabs' | 'createNewWorkspace' |
    'fetchWorkspaces' | 'switchWorkspace' | 'deleteWorkspace';
export type Tabs = Record<number, Tab>;
export type Workspaces = Record<number, Workspace>;
export type ClosedTabs = Record<number, chrome.tabs.Tab>;

export interface Workspace {
    id: number;
    title: string;
    tabs: Tabs;
    groups: chrome.tabGroups.TabGroup[];
    isCurrent: boolean;
}

export interface Tab {
    id: number;
    tab: chrome.tabs.Tab;
}

export interface Message<T = any> {
    type: MessageType;
    payload?: T; // Define your payload structure based on the message type
}

export interface Config {
    removeFromGroupOnDomainChange?: boolean;
    hibernationTimeout?: number;
    lastAccessedThreshold?: number;
    navigateToAlreadyOpenTab: boolean;
    closeTabAfterDuration: number;
}

// export interface WorkspaceMessage {
//     workspaces: Workspaces;
//     currentWorkspace: Workspace;
// }


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
export const domainGroupMap: { [domain: string]: number } = {};
export const tabGroupMap: { [tabId: number]: number } = {};
export const currentExpandedGroupId: {[group: string]: number | null} = { "group": null };

export const DEBOUNCE_DELAY = 500;
export const INACTIVITY_THRESHOLD = 20000;



// Background workspace functions

import {Config, defaultTab, Message, Tabs, Workspace, Workspaces} from "@/background/types.ts";
import {convertWorkspaceToMessage, updateConfig} from "@/background/utils.ts";
import MessageSender = chrome.runtime.MessageSender;

export async function loadWorkspaces(workspaces: Workspaces, lastActiveWorkspaceId: number) {
    if (workspaces && lastActiveWorkspaceId) {
        const currentSpace = workspaces[lastActiveWorkspaceId];
        console.log('Workspaces loaded from storage:', workspaces, 'Current workspace:', currentSpace);
        return {spaces: workspaces, currentSpace};
    }

    const defaultWorkspace = {
        id: 1,
        title: 'Default',
        tabs: [],
        groups: [],
        isCurrent: true
    };

    const spaces = {1: defaultWorkspace};
    const currentSpace = defaultWorkspace;

    await chrome.storage.local.set({workspaces: spaces, lastActiveWorkspaceId: 1});
    console.log('No workspaces found in storage, initializing with default workspace');
    return {spaces, currentSpace};
}

export function handleMessaging(config: Config, currentSpace: Workspace, spaces: Workspaces, message: Message, _sender: MessageSender, sendResponse: (response?: any) => void) {
    switch (message.type) {
        case 'updateConfig':
            updateConfig(config, message.payload);
            sendResponse({status: 'success'});
            break;
        case 'fetchTabs': {
            const messageWorkspace = convertWorkspaceToMessage(currentSpace);
            sendResponse({tabs: messageWorkspace.tabs});
            break;
        }
        case 'fetchWorkspaces': {
            const messageCurrentWorkspace = convertWorkspaceToMessage(currentSpace);
            const messageWorkspaces = Object.values(spaces).map((space) => convertWorkspaceToMessage(space));
            sendResponse({workspaces: messageWorkspaces, currentWorkspace: messageCurrentWorkspace});
            break;
        }
        // case 'createNewWorkspace':
        //     createNewWorkspace(message.payload);
        //     sendResponse({ status: 'success' });
        //     break;
        // case 'switchWorkspace':
        //     switchWorkspace(message.payload);
        //     sendResponse({ status: 'success' });
        //     break;
        // case 'deleteWorkspace':
        //     deleteWorkspace(message.payload);
        //     sendResponse({ status: 'success' });
        //     break;
        // default:
        //     sendResponse({ status: 'error', message: 'Invalid message type' });
    }
}

export async function createWorkspace(title: string, spaces: Workspaces, currentSpace: Workspace) {
    try {
        const id = Math.floor(Math.random() * 1000);
        const tabs: Tabs = {};
        if (title === "Default") {
            tabs[id] = {id: id, tab: defaultTab};
        }
        const workspace: Workspace = {
            id: id,
            title,
            tabs: tabs,
            groups: [],
            isCurrent: false
        };
        spaces[id] = workspace;
        await switchWorkspace(workspace, spaces, currentSpace);
        console.log('Workspace created:', workspace, 'All workspaces:', spaces, 'Current workspace:', currentSpace);

    } catch (e) {
        console.error('Error creating workspace:', e);
    }
}

async function switchWorkspace(workspace: Workspace, spaces: Workspaces, currentSpace: Workspace) {
    try {
        // Save and close current workspace tabs
        const lastActiveWorkspace = currentSpace;
        lastActiveWorkspace.isCurrent = false;
        // lastActiveWorkspace.tabs = await chrome.tabs.query({});

        // Close tabs only from the last active workspace
        // const tabIdsToRemove = lastActiveWorkspace.tabs.map((tab) => tab.id).filter((id): id is number => id !== undefined);
        const tabIdsToRemove = Object.keys(lastActiveWorkspace.tabs).map((tabId) => parseInt(tabId));

        // Update and load new workspace
        currentSpace = workspace;
        currentSpace.isCurrent = true;
        await loadWorkspaceTabs(workspace, currentSpace);

        spaces[currentSpace.id] = currentSpace;
        spaces[lastActiveWorkspace.id] = lastActiveWorkspace;

        // const newSpaces = spaces.map((space) => {
        //     if (space.id === workspace.id) {
        //         return currentSpace;
        //     } else if (space.id === lastActiveWorkspace.id) {
        //         return lastActiveWorkspace;
        //     } else {
        //         return space;
        //     }
        // });
        // spaces = newSpaces;

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

async function loadWorkspaceTabs(workspace: Workspace, currentSpace: Workspace) {
    try {
        if (workspace.tabs === undefined || Object.keys(workspace.tabs).length === 0) {
            await chrome.tabs.create({"url": "chrome://newtab", active: true});
        }
        for (const tab of Object.values(workspace.tabs)) {
            await chrome.tabs.create({
                url: tab.tab.url,
                active: false
            });
        }
        // const tabs = await chrome.tabs.query({});
        currentSpace.tabs = (await chrome.tabs.query({})).map((tab) => {
            return {id: tab.id!, tab};
        });
        currentSpace.groups = await chrome.tabGroups.query({});

        console.log('Loaded tabs for workspace:', workspace.title);
    } catch (error) {
        console.error('Error loading workspace tabs:', error);
    }
}
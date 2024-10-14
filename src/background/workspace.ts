// Background workspace functions

import {Config, Message, Workspace, Workspaces} from "@/background/types.ts";
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
        tabs: {},
        groups: [],
        isCurrent: true
    };

    const spaces = {1: defaultWorkspace};
    const currentSpace = defaultWorkspace;

    await chrome.storage.local.set({workspaces: spaces, lastActiveWorkspaceId: 1});
    console.log('No workspaces found in storage, initializing with default workspace');
    return {spaces, currentSpace};
}

export async function handleMessaging(config: Config, currentSpace: Workspace, spaces: Workspaces, message: Message, _sender: MessageSender, sendResponse: (response?: any) => void) {
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
        case 'createNewWorkspace': {
            const result = (await createNewWorkspace(message.payload, currentSpace, spaces));
            sendResponse({status: 'success'});
            return result;
        }
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

async function createNewWorkspace(title: string, currentSpace: Workspace, spaces: Workspaces) {
    try {
        const id = Math.floor(Math.random() * 1000);
        const newWorkspace: Workspace = {
            id,
            title,
            tabs: {},
            groups: [],
            isCurrent: false
        };
        spaces[id] = newWorkspace;

        const result = await switchWorkspace(newWorkspace, spaces, currentSpace);
        if (result) {
            console.log('Workspace created:', newWorkspace, "\n", 'All workspaces:', result.newSpaces, "\n", 'Current workspace:', result.newCurrentSpace);
            return result;
        }
    } catch (e) {
        console.error('Error creating workspace:', e);
        throw new Error('Failed to create and switch to new workspace.');
    }
}


async function switchWorkspace(newWorkspace: Workspace, spaces: Workspaces, currentSpace: Workspace) {
    try {
        const lastActiveWorkspace = {...currentSpace, isCurrent: false};
        const tabIdsToRemove = Object.values(lastActiveWorkspace.tabs)
            .map(tab => tab.id)
            .filter((id): id is number => id !== undefined);

        currentSpace = {...newWorkspace, isCurrent: true};
        spaces[currentSpace.id] = currentSpace;
        spaces[lastActiveWorkspace.id] = lastActiveWorkspace;

        await loadWorkspaceTabs(newWorkspace, currentSpace);
        await chrome.storage.local.set({
            workspaces: spaces,
            lastActiveWorkspaceId: currentSpace.id
        });

        await chrome.tabs.remove(tabIdsToRemove);
        // console.log('Switched to workspace:', currentSpace);
        return {newSpaces: spaces, newCurrentSpace: currentSpace};
    } catch (error) {
        console.error('Error switching workspace:', error);
        throw new Error('Failed to switch workspaces.');
    }
}


async function loadWorkspaceTabs(workspace: Workspace, currentSpace: Workspace) {
    try {
        // Handle case where no tabs exist in workspace
        if (!workspace.tabs || Object.keys(workspace.tabs).length === 0) {
            await chrome.tabs.create({url: "chrome://newtab", active: true});
            return;
        }

        const tabPromises = Object.values(workspace.tabs).map(tab =>
            chrome.tabs.create({
                url: tab.tab.url,
                active: false
            })
        );
        await Promise.all(tabPromises);

        currentSpace.tabs = (await chrome.tabs.query({})).map(tab => ({id: tab.id!, tab}));
        currentSpace.groups = await chrome.tabGroups.query({});

        console.log('Loaded tabs for workspace:', workspace.title);
    } catch (error) {
        console.error('Error loading workspace tabs:', error);
        throw new Error('Failed to load workspace tabs.');
    }
}

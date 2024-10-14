// Background workspace functions

import {Message, Workspaces, Config} from "@/background/types.ts";
import MessageSender = chrome.runtime.MessageSender;
import {updateConfig} from "@/background/utils.ts";

export async function loadWorkspaces(workspaces: Workspaces, lastActiveWorkspaceId: number) {
    if (workspaces && lastActiveWorkspaceId) {
        const currentSpace = workspaces[lastActiveWorkspaceId];
        console.log('Workspaces loaded from storage:', workspaces, 'Current workspace:', currentSpace);
        return { spaces: workspaces, currentSpace };
    }

    const defaultWorkspace = {
        id: 1,
        title: 'Default',
        tabs: [],
        groups: [],
        isCurrent: true
    };

    const spaces = { 1: defaultWorkspace };
    const currentSpace = defaultWorkspace;

    await chrome.storage.local.set({ workspaces: spaces, lastActiveWorkspaceId: 1 });
    console.log('No workspaces found in storage, initializing with default workspace');
    return { spaces, currentSpace };
}

export function handleMessaging(config: Config, message: Message, _sender: MessageSender, sendResponse: (response?: any) => void) {
    switch (message.type) {
        case 'updateConfig':
            updateConfig( config ,message.payload);
            sendResponse({ status: 'success' });
            break;
        // case 'fetchTabs':
        //     sendResponse({ tabs: currentSpace.tabs });
        //     break;
        // case 'fetchWorkspaces':
        //     sendResponse({ workspaces: spaces, currentWorkspace: currentSpace });
        //     break;
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
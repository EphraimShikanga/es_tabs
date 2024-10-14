// Background workspace functions

import {Config, Message, Workspace, Workspaces} from "@/background/types.ts";
import {checkIrrelevantTabs, convertWorkspaceToMessage, updateConfig} from "@/background/utils.ts";
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
        tabs: {
            1: {
                id: 1,
                tab: {
                    selected: true,
                    id: 1,
                    url: 'chrome://newtab/',
                    title: 'New Tab',
                    favIconUrl: 'tabss.webp',
                    active: true,
                    pinned: false,
                    discarded: false,
                    autoDiscardable: true,
                    mutedInfo: {muted: false},
                    groupId: chrome.tabGroups.TAB_GROUP_ID_NONE,
                    windowId: 1,
                    index: 1,
                    highlighted: true,
                    incognito: false
                }
            }
        },
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
        case 'switchWorkspace': {
            switchWorkspace(message.payload, spaces, currentSpace).then((result) => {
                if (result && result.newCurrentSpace && result.newSpaces) {
                    sendResponse({status: 'success', result});
                    return result;
                }
            });
            break;
            // sendResponse({status: 'success', result: result});
        }
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


async function switchWorkspace(newWorkspace: Workspace | number, spaces: Workspaces, currentSpace: Workspace) {

    if (typeof newWorkspace === 'number') {
        newWorkspace = spaces[newWorkspace];
    }
    console.log("Will switch to workspace: ", newWorkspace, "\n", "Current workspace: ", currentSpace);

    const lastActiveWorkspace = {...currentSpace, isCurrent: false};

    const newActiveWorkspace = {...newWorkspace, isCurrent: true};
    const {newTabs, newGroups} = await loadWorkspaceTabs(newActiveWorkspace);
    if (newTabs && newGroups) {
        newActiveWorkspace.tabs = newTabs;
        newActiveWorkspace.groups = newGroups;
    }

    console.log("Has Switched to workspace: ", newActiveWorkspace, "\n", "From workspace: ", lastActiveWorkspace);

    const newSpaces = {...spaces};
    newSpaces[newActiveWorkspace.id] = newActiveWorkspace;
    newSpaces[lastActiveWorkspace.id] = lastActiveWorkspace;

    console.log("Has Changed Workspaces to: ", newSpaces, "\n", "From ", spaces);

    await chrome.storage.local.set({
        workspaces: newSpaces,
        lastActiveWorkspaceId: newActiveWorkspace.id
    });

    // const tabIdsToRemove = convertWorkspaceToMessage(lastActiveWorkspace).tabs
    //     .map((tab) => tab.id)
    //     .filter((id): id is number => id !== undefined);

    // await chrome.tabs.create({url: "chrome://newtab", active: true});

    // for (const tab of tabIdsToRemove) {
    //     console.log("Will remove tab: ", tab);
    //     await chrome.tabs.remove(tab);
    // }
    return {newSpaces: newSpaces, newCurrentSpace: newActiveWorkspace};
    // if (newWorkspace.isCurrent) return {newSpaces: spaces, newCurrentSpace: currentSpace};
    //
    //
    // const lastActiveWorkspace = {...currentSpace, isCurrent: false};
    // const tabIdsToRemove = convertWorkspaceToMessage(lastActiveWorkspace).tabs
    //     .map((tab) => tab.id)
    //     .filter((id): id is number => id !== undefined);
    //
    // currentSpace = {...newWorkspace, isCurrent: true};
    // currentSpace.isCurrent = true;
    //
    // const newSpaces = {...spaces};
    // newSpaces[currentSpace.id] = currentSpace;
    // newSpaces[lastActiveWorkspace.id] = lastActiveWorkspace;
    //
    // await loadWorkspaceTabs(newWorkspace, currentSpace);
    //
    // await chrome.storage.local.set({
    //     workspaces: newSpaces,
    //     lastActiveWorkspaceId: currentSpace.id
    // });
    // // console.log("Will remove these ",tabIdsToRemove);
    // await chrome.tabs.remove(tabIdsToRemove);
    // console.log('Switched to workspace:', currentSpace);
    //
    // return {newSpaces: newSpaces, newCurrentSpace: currentSpace};
}


async function loadWorkspaceTabs(workspace: Workspace) {
    // Handle case where no tabs exist in workspace
    if (!workspace.tabs || Object.keys(workspace.tabs).length === 0) {
        await chrome.tabs.create({url: "chrome://newtab", active: true});
        return {newTabs: {}, newGroups: []};
    }

    Object.values(workspace.tabs).map(async (tab) => {
            if (!checkIrrelevantTabs(tab.tab)) {
                await chrome.tabs.create({
                    url: tab.tab.url,
                    active: false
                })
            }
        }
    );

    const newTabs = (await chrome.tabs.query({}))
        .map(tab => ({id: tab.id!, tab}))
        .filter(tab => !checkIrrelevantTabs(tab.tab));
    const newGroups = await chrome.tabGroups.query({});
    await chrome.tabs.create({url: "chrome://newtab", active: true});

    return {newTabs, newGroups};
}

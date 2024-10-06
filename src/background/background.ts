chrome.tabs.onCreated.addListener(async (tab) => {
    await collapseAllGroups();
    await manageTabs(tab.id);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, ) => {
    if (changeInfo.status === 'complete') {
        await manageTabs(tabId);
    }
});

chrome.tabs.onRemoved.addListener(async () => {
    await manageTabs();
    await cleanupGroups();
});

async function collapseAllGroups() {
    try {
        const groups = await chrome.tabGroups.query({});
        for (const group of groups) {
            await chrome.tabGroups.update(group.id, { collapsed: true });
        }
    } catch (error) {
        console.error("Error collapsing groups: ", error);
    }
}

async function manageTabs(newTabId?: number) {
    try {
        const tabs = await chrome.tabs.query({});
        const domainMap: { [domain: string]: chrome.tabs.Tab[] } = {};

        tabs.forEach((tab) => {
            const url = tab.url;
            if (url) {
                const domain = new URL(url).hostname.replace(/^www\./, '');

                if (!domainMap[domain]) {
                    domainMap[domain] = [];
                }
                domainMap[domain].push(tab);
            }
        });

        let expandedGroupId: number | null = null;

        for (const domain in domainMap) {
            const domainTabs = domainMap[domain];

            if (domainTabs.length > 1) {
                const tabIds = domainTabs.map((tab) => tab.id).filter((id): id is number => id !== undefined);

                const groupId = await chrome.tabs.group({ tabIds });

                // If the new tab belongs to this group, expand it
                if (newTabId && tabIds.includes(newTabId)) {
                    expandedGroupId = groupId;
                }

                await chrome.tabGroups.update(groupId, { title: domain, collapsed: true });
            }
        }

        // Expand the group with the new tab
        if (expandedGroupId !== null) {
            await chrome.tabGroups.update(expandedGroupId, { collapsed: false });
        }

        if (tabs.length > 10) {
            const excessTabs = tabs.length - 10;

            const sortedTabs = tabs.sort((a, b) => (a.id && b.id ? a.id - b.id : 0));

            for (let i = 0; i < excessTabs; i++) {
                if (sortedTabs[i].id !== undefined) {
                    await chrome.tabs.remove(sortedTabs[i].id!);
                }
            }
        }
    } catch (error) {
        console.error("Error managing tabs: ", error);
    }
}

async function cleanupGroups() {
    try {
        const tabs = await chrome.tabs.query({});
        const groupTabCount: { [groupId: number]: chrome.tabs.Tab[] } = {};

        tabs.forEach(tab => {
            if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
                if (!groupTabCount[tab.groupId]) {
                    groupTabCount[tab.groupId] = [];
                }
                groupTabCount[tab.groupId].push(tab);
            }
        });

        for (const groupId in groupTabCount) {
            const groupTabs = groupTabCount[parseInt(groupId)];
            if (groupTabs.length === 1) {
                const tabId = groupTabs[0].id;

                if (tabId !== undefined) {
                    await chrome.tabs.ungroup(tabId);
                }
            }
        }
    } catch (error) {
        console.error("Error cleaning up groups: ", error);
    }
}
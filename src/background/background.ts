chrome.tabs.onCreated.addListener(async () => {
    await manageTabs();
});

chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo) => {
    if (changeInfo.status === 'complete') {
        await manageTabs();
    }
});

chrome.tabs.onRemoved.addListener(async () => {
    await manageTabs();
    await cleanupGroups();
});

async function manageTabs() {
    try {
        const tabs = await chrome.tabs.query({});

        if (tabs.length > 3) {
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

            for (const domain in domainMap) {
                const domainTabs = domainMap[domain];

                if (domainTabs.length > 1) {
                    const tabIds = domainTabs.map((tab) => tab.id).filter((id): id is number => id !== undefined);

                    const groupId = await chrome.tabs.group({ tabIds });

                    await chrome.tabGroups.update(groupId, { title: domain, collapsed: true });
                }
            }

            if (tabs.length > 10) {
                const excessTabs = tabs.length - 10;

                // Sort tabs by their ID (this generally correlates with creation time)
                const sortedTabs = tabs.sort((a, b) => (a.id && b.id ? a.id - b.id : 0));

                // Close the older excess tabs
                for (let i = 0; i < excessTabs; i++) {
                    if (sortedTabs[i].id !== undefined) {
                        await chrome.tabs.remove(sortedTabs[i].id!);
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error managing tabs: ", error);
    }
}

async function cleanupGroups() {
    try {
        // const groups = await chrome.tabGroups.query({});
        const tabs = await chrome.tabs.query({});

        // Map to keep track of tabs in each group
        const groupTabCount: { [groupId: number]: chrome.tabs.Tab[] } = {};

        tabs.forEach(tab => {
            if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
                if (!groupTabCount[tab.groupId]) {
                    groupTabCount[tab.groupId] = [];
                }
                groupTabCount[tab.groupId].push(tab);
            }
        });

        // Loop through each group and check if it only contains one tab
        for (const groupId in groupTabCount) {
            const groupTabs = groupTabCount[parseInt(groupId)];
            if (groupTabs.length === 1) {
                const tabId = groupTabs[0].id;

                // Ungroup the tab and remove the group
                if (tabId !== undefined) {
                    await chrome.tabs.ungroup(tabId);
                }
            }
        }
    } catch (error) {
        console.error("Error cleaning up groups: ", error);
    }
}

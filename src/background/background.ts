import ColorEnum = chrome.tabGroups.ColorEnum;

chrome.tabs.onCreated.addListener(async (tab) => {
    await collapseAllGroups();
    await manageTabs(tab.id);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    if (changeInfo.status === 'complete') {
        await manageTabs(tabId);
    }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
    await cleanupGroups(tabId);
    delete tabAccessTimes[tabId];
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        tabAccessTimes[activeInfo.tabId] = Date.now();
        const tab = await chrome.tabs.get(activeInfo.tabId);

        if (tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
            await collapseAllGroups();
        } else {
            try {
                const group = await chrome.tabGroups.get(tab.groupId);

                if (group) {
                    await collapseAllGroups(tab.groupId);
                    await chrome.tabGroups.update(tab.groupId, { collapsed: false });
                }
            } catch (groupError) {
                console.warn(`Group with id ${tab.groupId} no longer exists.`, groupError);
            }
        }
    } catch (error) {
        console.error("Error handling tab activation: ", error);
    }
});

async function collapseAllGroups(exceptGroupId?: number) {
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const groups = await chrome.tabGroups.query({});
        for (const group of groups) {
            if (group.id !== exceptGroupId) {
                await chrome.tabGroups.update(group.id, {collapsed: true});
            }
        }
    } catch (error) {
        console.error("Error collapsing groups: ", error);
    }
}


const availableColors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
const usedColors = new Set<string>();

async function getColorForDomain(domain: string): Promise<string> {
    const storedColors = await chrome.storage.local.get('domainColors');
    const domainColors = storedColors.domainColors || {};

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
    await chrome.storage.local.set({ domainColors });

    return randomColor;
}

async function manageTabs(newTabId?: number) {
    try {
        const tabs = await chrome.tabs.query({});
        const domainMap: { [domain: string]: chrome.tabs.Tab[] } = {};

        tabs.forEach((tab) => {
            const url = tab.url;
            if (url && !url.startsWith("chrome://")) {
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

                const groupId = await chrome.tabs.group({tabIds});

                if (newTabId && tabIds.includes(newTabId)) {
                    expandedGroupId = groupId;
                }

                await chrome.tabGroups.update(groupId, { title: domain, collapsed: true, color: await getColorForDomain(domain) as ColorEnum | undefined });            }
        }

        if (expandedGroupId !== null) {
            await chrome.tabGroups.update(expandedGroupId, {collapsed: false});
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

async function cleanupGroups(closedTabId: number) {
    try {
        const tabs = await chrome.tabs.query({});
        const groupTabCount: { [groupId: number]: chrome.tabs.Tab[] } = {};
        let groupToExpand: number | null = null;

        tabs.forEach(tab => {
            if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
                if (!groupTabCount[tab.groupId]) {
                    groupTabCount[tab.groupId] = [];
                }
                groupTabCount[tab.groupId].push(tab);

                if (tab.id === closedTabId) {
                    groupToExpand = tab.groupId;
                }
            }
        });

        if (groupToExpand !== null) {
            await collapseAllGroups(groupToExpand);
            await chrome.tabGroups.update(groupToExpand, { collapsed: false });
        }

        for (const groupId in groupTabCount) {
            if (groupTabCount[groupId].length === 1) {
                await chrome.tabs.ungroup(groupTabCount[groupId][0].id!);
            }
        }
    } catch (error) {
        console.error("Error cleaning up groups: ", error);
    }
}


const tabAccessTimes: { [tabId: number]: number } = {};
const INACTIVITY_THRESHOLD = 10 * 1000;

setInterval(async () => {
    console.log("Checking for tabs to hibernate...");
    const now = Date.now();

    try {
        const tabs = await chrome.tabs.query({});
        const activeTab = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeTabId = activeTab[0]?.id;
        const groupedTabs: { [groupId: number]: chrome.tabs.Tab[] } = {};
        const ungroupedTabs: chrome.tabs.Tab[] = [];

        for (const tab of tabs) {
            if (tab.url && tab.url.startsWith("chrome://")) {
                continue;
            }
            if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
                if (!groupedTabs[tab.groupId]) {
                    groupedTabs[tab.groupId] = [];
                }
                groupedTabs[tab.groupId].push(tab);
            } else {
                ungroupedTabs.push(tab);
            }
        }

        // Handle grouped tabs
        for (const groupId in groupedTabs) {
            const groupTabs = groupedTabs[groupId];
            if (groupTabs.length > 1) {
                for (const tab of groupTabs) {
                    const lastAccessTime = tabAccessTimes[tab.id!];
                    if (tab.id !== activeTabId && lastAccessTime && now - lastAccessTime > INACTIVITY_THRESHOLD) {
                        console.log(`Hibernating grouped tab: ${tab.id}`);
                        await chrome.tabs.discard(tab.id!);
                    }
                }
            }
        }

        for (const tab of ungroupedTabs) {
            const lastAccessTime = tabAccessTimes[tab.id!];
            if (tab.id !== activeTabId && lastAccessTime && now - lastAccessTime > INACTIVITY_THRESHOLD) {
                console.log(`Hibernating ungrouped tab: ${tab.id}`);
                await chrome.tabs.discard(tab.id!);
            }
        }

    } catch (error) {
        console.error("Error during tab hibernation check:", error);
    }
}, 30 * 1000);



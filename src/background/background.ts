chrome.tabs.onCreated.addListener(async () => {
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
});

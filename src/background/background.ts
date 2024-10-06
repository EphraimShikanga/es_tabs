chrome.tabs.onCreated.addListener(async () => {
    try {
        const tabs = await chrome.tabs.query({});
        console.log("tabs: ", tabs);

        if (tabs.length > 5) {

            const sortedTabs = tabs.sort((a, b) => (a.id && b.id ? a.id - b.id : 0));

            // group tabs by domain

            const excessTabs = tabs.length - 5;

            for (let i = 0; i < excessTabs; i++) {
                if (sortedTabs[i].id !== undefined) {
                    await chrome.tabs.remove(sortedTabs[i].id!);
                }
            }
        }
    } catch (error) {
        console.error("Error closing older tabs: ", error);
    }
});

import React, {useEffect} from "react";
import {List, ListItem, ListItemPrefix, ListItemSuffix, TabPanel} from "@material-tailwind/react";

type ClosedTabProps = {
    value: string;
}

const ClosedTab: React.FC<ClosedTabProps> = ({value}) => {
    const [closedTabs, setClosedTabs] = React.useState<chrome.tabs.Tab[]>([]);
    useEffect(() => {
        try {
            chrome.runtime.sendMessage({type: 'fetchClosedTabs'}, (response) => {
                if (response?.closedTabs) {
                    setClosedTabs(response.closedTabs);
                }
            });
        } catch (error) {
            console.error("Error fetching closed tabs: ", error);
        }
    }, []);

    const handleTabClick = async (tab: chrome.tabs.Tab) => {
        try {
            chrome.runtime.sendMessage({type: 'restoreTab', payload: tab.id}, (response) => {
                if (response?.status === 'success') {
                    setClosedTabs(response.closedTabs);
                    console.log("Tab restored successfully");
                }
            });
        } catch (error) {
            console.error("Error restoring tab: ", error);
        }
    };

    return (
        <TabPanel value={value} className={"h-full overflow-auto scrollbar-webkit"}>
            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
            {/*@ts-expect-error*/}
            <List>
                {
                    closedTabs.map((tab, index) =>
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-expect-error
                        <ListItem onClick={() => handleTabClick(tab)} key={index}
                                  className={"h-10 hover:bg-white/20 flex flex-row justify-between"}>
                            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                            {/*@ts-expect-error*/}
                            <ListItemPrefix className={"bg-white/50 rounded-lg items-center p-1"}>
                                <img
                                    src={tab.favIconUrl ? tab.favIconUrl : "tabss.webp"}
                                    alt={tab.title}
                                    height={"30px"}
                                    width={"30px"}
                                />
                            </ListItemPrefix>
                            <p className={"text-black w-full text-start text-sm truncate"}>{tab.title!.split("-")[0]}</p>
                            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                            {/*@ts-expect-error*/}
                            <ListItemSuffix className={"w-full items-end"}>
                                <p className={"text-xs text-end w-full truncate"}>{new URL(tab.url!).hostname}</p>
                            </ListItemSuffix>
                        </ListItem>
                    )
                }
            </List>
        </TabPanel>
    )
}

export default ClosedTab;

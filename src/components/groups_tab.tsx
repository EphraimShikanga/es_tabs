import {
    Collapse,
    IconButton,
    List,
    ListItem,
    ListItemPrefix,
    ListItemSuffix,
    TabPanel,
    Typography
} from "@material-tailwind/react";
import {ChevronDown, ChevronUp} from "lucide-react";
import React, {useState} from "react";
import {useWorkspace} from "@/lib/WorkContext.tsx";

type GroupsTabProps = {
    value: string;
}

type GroupProps = {
    group: chrome.tabGroups.TabGroup;
    tabs: chrome.tabs.Tab[];
}

type GroupTabsProps = {
    tabs: chrome.tabs.Tab[];
}

const GroupTabs: React.FC<GroupTabsProps> = ({tabs}) => {
    const handleTabClick = async (tab: chrome.tabs.Tab) => {
        if (tab.active) {

            return;
        }
        try {
            // const e = await chrome.tabs.query({url: tab.url});
            await chrome.tabs.update(tab.id!, {active: true});
        } catch (error) {
            console.error("Error updating tab: ", error);
        }

    };
    return (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        <List>
            {
                tabs.map((tab, index) =>
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
    );
}

const Group: React.FC<GroupProps> = ({group, tabs}) => {
    const [open, setOpen] = useState(false);
    return (
        <div key={group.id}>
            {/*<div className={`absolute top-3 -left-2 ${open ? "h-[92%]" : "h-[70%]"} w-1 rounded-r-md`}*/}
            {/*     style={{backgroundColor: group.color}}>*/}

            {/*</div>*/}
            <div className={"flex flex-col"}>
                <div className={"w-full h-10 rounded-lg flex flex-row justify-between items-center bg-opacity-60 px-3 "}
                     style={{backgroundColor: group.color}}>
                    <div onClick={() => setOpen(!open)} className={"flex flex-row gap-2 flex-grow cursor-default"}>
                        {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                        {/*@ts-expect-error*/}
                        <Typography className={"text-black font-medium"}>
                            {group.title}
                        </Typography>
                        <div
                            className={"rounded-full h-6 w-7 flex items-center justify-center text-black bg-white/70"}>
                            <p>
                                {tabs.length}
                            </p>
                        </div>
                    </div>
                    <div className={"flex flex-row"}>
                        {/*/!*eslint-disable-next-line @typescript-eslint/ban-ts-comment*!/*/}
                        {/*/!*@ts-expect-error*!/*/}
                        {/*<IconButton size={"sm"} variant="text" color="white" className={"rounded-full"}*/}
                        {/*            onClick={() => console.log("Add tab")}*/}
                        {/*>*/}
                        {/*    <Plus size={"18px"} color={"black"}/>*/}
                        {/*</IconButton>*/}
                        {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                        {/*@ts-expect-error*/}
                        <IconButton onClick={() => setOpen(!open)} size={"sm"} variant="text" color="white"
                                    className={"rounded-full"}>

                            {
                                open
                                    ? <ChevronUp size={"18px"} color={"black"}/>
                                    : <ChevronDown size={"18px"} color={"black"}/>
                            }
                        </IconButton>
                    </div>
                </div>
                <div className={"mb-2"}>
                    <Collapse open={open} className={"max-h-56"}>
                        <GroupTabs tabs={tabs}/>
                    </Collapse>
                </div>
            </div>
        </div>
    );
}


const GroupsTab: React.FC<GroupsTabProps> = ({value}) => {
    const {currentWorkspace} = useWorkspace();
    return (
        <TabPanel value={value} className={"h-full overflow-auto scrollbar-webkit"}>
            {
                currentWorkspace.groups.map((group, index) => {
                    const tabs = currentWorkspace.tabs.filter(tab => tab.groupId === group.id);
                    return <Group key={index} group={group} tabs={tabs}/>;
                })
            }
        </TabPanel>
    )
}

export default GroupsTab;

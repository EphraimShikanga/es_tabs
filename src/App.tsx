import {Input} from "@/components/ui/input.tsx";
import {Search} from "lucide-react";
import React, {useEffect, useState} from "react";
import ChromeTab from "@/components/chrome_tab.tsx";
import {Tabs, TabsBody, TabsHeader,} from "@material-tailwind/react";
import ExtensionTab from "@/components/extension_tab.tsx";
import WorkspaceTab from "@/components/workspace_tab.tsx";

function App() {
    const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filteredTabs, setFilteredTabs] = useState<chrome.tabs.Tab[]>([]);
    const [displayedTabs, setDisplayedTabs] = useState<chrome.tabs.Tab[]>([]);
    const [activeTab, setActiveTab] = React.useState("Workspaces");
    const [selected, setSelectedItem] = React.useState(0);


    useEffect(() => {
        setFilteredTabs(tabs.filter((tab) =>
            tab.title!.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tab.url!.toLowerCase().includes(searchQuery.toLowerCase())
        ));
    }, [searchQuery, tabs]);

    useEffect(() => {
        const updateTabCount = async () => {
            try {
                const tabs = (await chrome.tabs.query({})).filter((tab) => !tab.url?.startsWith("chrome://"));
                setTabs(tabs);

                setDisplayedTabs(getUniqueTabs(tabs, 4));
                console.log(tabs);
            } catch (error) {
                console.error("Error fetching tabs: ", error);
            }
        };

        updateTabCount().then((r) => r);
    }, []);

    const getUniqueTabs = (tabs: chrome.tabs.Tab[], limit: number) => {
        const uniqueTabs: chrome.tabs.Tab[] = [];
        const groupIds: Set<number> = new Set();

        for (const tab of tabs) {
            if (groupIds.has(tab.groupId)) {
                continue;
            }
            uniqueTabs.push(tab);

            if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
                groupIds.add(tab.groupId);
            }
            if (uniqueTabs.length === limit) {
                break;
            }
        }
        return uniqueTabs;
    };

    return (
        <div
            className={"p-2 h-[500px] w-[388px]"}
            style={{
                backgroundImage: "url('tabss.webp')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        >
            <div className={"h-full w-full bg-black rounded-lg p-2 bg-opacity-20 backdrop-filter backdrop-blur-sm"}>
                <div className={"flex flex-row items-end w-full justify-between"}>
                    <div className={"bg-white/10 rounded-full flex flex-row items-end pl-2"}>
                        <Search color="rgb(226 232 240)" size={"24px"} className={"mb-[6px]"}/>
                        <Input
                            onChange={(event) => setSearchQuery(event.target.value)}
                            id={"search"}
                            type={"text"}
                            placeholder={"Search tabs..."}
                            className={"placeholder:text-slate-200 pl-2 border-none text-lg text-slate-200 focus-visible:ring-transparent"}
                        />
                    </div>
                    <div
                        className={"rounded-full h-9 w-12 flex items-center justify-center text-slate-200 bg-white/10"}>
                        <p>
                            {
                                searchQuery.length < 1
                                    ? tabs.length
                                    : filteredTabs.length
                            }
                        </p>
                    </div>
                </div>
                <div className="group/tabs flex flex-row h-22 w-full py-1 gap-2 overflow-x-auto scrollbar-webkit">
                    {searchQuery.length < 1
                        ? displayedTabs.map((tab, index) => (
                            <ChromeTab key={index} tab={tab}/>
                        ))
                        : filteredTabs.map((tab, index) => (
                            <ChromeTab key={index} tab={tab}/>
                        ))}
                </div>

                <div className={"h-[90%] p-1"}>
                    <Tabs value={activeTab}>
                        <TabsHeader
                            placeholder=""
                            onPointerEnterCapture={() => {
                            }}
                            onPointerLeaveCapture={() => {
                            }}
                            className={"rounded-none border-blue-50 bg-transparent p-0 group/tab"}
                            indicatorProps={{className: "bg-transparent border-b-2 border-[#1e293b] shadow-none rounded-none",}}
                        >
                            <ExtensionTab value={"Workspaces"} activeTab={activeTab}
                                          onClick={(value) => setActiveTab(value)}/>
                            <ExtensionTab value={"Groups"} activeTab={activeTab}
                                          onClick={(value) => setActiveTab(value)}/>
                            <ExtensionTab value={"Closed"} activeTab={activeTab}
                                          onClick={(value) => setActiveTab(value)}/>
                            <ExtensionTab value={"Settings"} activeTab={activeTab}
                                          onClick={(value) => setActiveTab(value)}/>

                        </TabsHeader>
                        <TabsBody
                            className={"h-96 w-full rounded-lg p-2"}
                            placeholder=""
                            onPointerEnterCapture={() => {
                            }}
                            onPointerLeaveCapture={() => {
                            }}
                        >
                            <WorkspaceTab value={"Workspaces"} selected={selected}
                                          setSelectedItem={(index) => setSelectedItem(index)}/>
                        </TabsBody>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

export default App;

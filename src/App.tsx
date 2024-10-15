import {Input} from "@/components/ui/input.tsx";
import {Search} from "lucide-react";
import {useEffect, useMemo, useState} from "react";
import {useDebounce} from 'use-debounce';
import ChromeTab from "@/components/chrome_tab.tsx";
import {Tabs, TabsBody, TabsHeader,} from "@material-tailwind/react";
import ExtensionTab from "@/components/extension_tab.tsx";
import GroupsTab from "@/components/groups_tab.tsx";
import WorkspaceTab from "@/components/workspace_tab.tsx";
import {WorkspaceProvider} from "@/lib/WorkContext.tsx";
import ClosedTab from "@/components/closed_tab.tsx";
import SettingsTab from "@/components/settings_tab.tsx";


function App() {
    const [activeTab, setActiveTab] = useState("Workspaces");
    const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");

    const [debouncedSearchQuery] = useDebounce(searchQuery, 1000);

    useEffect(() => {
        const updateTabCount = async () => {
            try {
                chrome.runtime.sendMessage({ type: 'fetchTabs' }, (response) => {
                    if (response?.tabs) {
                        setTabs(response.tabs);
                    }
                });
            } catch (error) {
                console.error("Error fetching tabs: ", error);
            }
        };
        updateTabCount().then(r => r);
    }, []);

    const filteredTabs = useMemo(() => {
        return tabs.filter((tab) =>
            tab.title!.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
            tab.url!.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );
    }, [debouncedSearchQuery, tabs]);

    const displayedTabs = useMemo(() => {
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
            if (uniqueTabs.length === 4) {
                break;
            }
        }
        return uniqueTabs;
    }, [tabs]);

    return (
        <div className={"h-full w-full p-4"}>
            <div
                className={" h-full w-full bg-white rounded-lg pl-0 p-2 bg-opacity-20 backdrop-filter backdrop-blur-sm"}>
                <div className={"pl-2 flex flex-row items-end w-full justify-between"}>
                    <div className={"bg-white/10 rounded-full flex flex-row items-end pl-2"}>
                        <Search color=" rgb(120 144 156 )" size={"24px"} className={"mb-[6px]"}/>
                        <Input
                            onChange={(event) => setSearchQuery(event.target.value)}
                            id={"search"}
                            type={"text"}
                            placeholder={"Search tabs..."}
                            className={"placeholder:text-blue-gray-400 pl-2 border-none text-lg text-blue-gray-800 focus-visible:ring-transparent"}
                        />
                    </div>
                    <div
                        className={"rounded-full h-9 w-12 flex items-center justify-center text-blue-gray-800 bg-white/10"}>
                        <p>
                            {
                                searchQuery.length < 1
                                    ? tabs.length
                                    : filteredTabs.length
                            }
                        </p>
                    </div>
                </div>
                <div className="group/tabs flex flex-row h-22 w-full py-1 pl-2 gap-2 overflow-x-auto scrollbar-webkit">
                    {/*<div className={"h-20 w-20 bg-red-500"}></div>*/}
                    {searchQuery.length < 1
                        ? displayedTabs.map((tab, index) => (
                            <ChromeTab key={index} tab={tab}/>
                        ))
                        : filteredTabs.map((tab, index) => (
                            <ChromeTab key={index} tab={tab}/>
                        ))}
                </div>

                < div
                    className = {`pl-0 p-1 relative w-full ${tabs.length === 0 || filteredTabs.length === 0 ? "h-[92%]" : "h-[78%]"}`
                    }>
                    <
                        Tabs
                        value = {activeTab}
                        className = {"h-full"} >
                        {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                        {/*@ts-expect-error*/}
                        <TabsHeader
                            defaultValue={"Groups"}
                            className={"rounded-none border-blue-50 bg-transparent p-0 pl-2 group/tab"}
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
                        {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                        {/*@ts-expect-error*/}
                        <TabsBody
                            // defaultValue={"Groups"}
                            className={"h-full w-full rounded-lg p-2 "}
                        >
                            <WorkspaceProvider>
                                <WorkspaceTab value={"Workspaces"}/>
                                <GroupsTab value={"Groups"}/>
                                <ClosedTab value={"Closed"}/>
                                <SettingsTab value={"Settings"}/>
                            </WorkspaceProvider>
                        </TabsBody>
                    </Tabs>
                </div>

            </div>
        </div>
    );
}

export default App

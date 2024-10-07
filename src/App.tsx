import {Tabs} from "@/components/ui/tabs"
import {Input} from "@/components/ui/input.tsx";
import {Search} from "lucide-react";
import {useEffect, useState} from "react";

function App() {
    const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filteredTabs, setFilteredTabs] = useState<chrome.tabs.Tab[]>([]);

    useEffect(() => {
            setFilteredTabs(tabs.filter(tab => tab.title!.toLowerCase().includes(searchQuery.toLowerCase())));
        }, [searchQuery, tabs]
    )

    useEffect(() => {
        const updateTabCount = async () => {
            try {
                const tabs = (await chrome.tabs.query({})).filter(tab => !tab.url?.startsWith("chrome://"));
                setTabs(tabs);
            } catch (error) {
                console.error("Error fetching tabs: ", error);
            }
        };

        updateTabCount().then(r => r);
    }, []);
    return (
        <div className={"p-2 h-[500px] w-[388px]"}

             style={{
                 backgroundImage: "url('tabss.webp')",
                 backgroundSize: "cover",
                 backgroundPosition: "center",
                 backgroundRepeat: "no-repeat"
             }}
        >
            <div className={"h-full w-full bg-black rounded-lg p-2 bg-opacity-20 backdrop-filter backdrop-blur-sm"}>
                <div className={"flex flex-row items-end w-full justify-between "}>
                    <div className={"bg-white/10 rounded-full flex flex-row items-end pl-2 "}>
                        <Search color="rgb(226 232 240)" size={"24px"} className={"mb-[6px]"}/>
                        <Input onChange={(event) => setSearchQuery(event.target.value)} id={"search"} type={"text"}
                               placeholder={"Search tabs..."}
                               className={"placeholder:text-slate-200 pl-2 border-none text-lg text-slate-200 focus-visible:ring-transparent"}/>
                    </div>
                    <div
                        className={"rounded-full h-9 w-12 flex items-center justify-center text-slate-200 bg-white/10"}>
                        <p>
                            {tabs.length}
                        </p>
                    </div>
                </div>
                <div className="flex flex-row h-22 w-full py-1 gap-2 overflow-x-auto">
                    {searchQuery.length < 1
                        ?
                        tabs.slice(0, 4).map((tab) => (
                            <div
                                key={tab.id}
                                className="min-w-20 w-20 h-20 bg-black/10 rounded-lg flex flex-col items-center justify-center p-1"
                            >
                                <p className="text-xs text-slate-200 text-center truncate w-full">{tab.title}</p>
                                <img
                                    src={tab.favIconUrl ? tab.favIconUrl : 'log.jpeg'} // Fallback to default image
                                    alt={tab.title}
                                    className="w-10 h-10 mt-1"
                                />
                            </div>
                        ))
                        :
                        filteredTabs.map((tab) => (
                            <div
                                key={tab.id}
                                className="min-w-20 w-20 h-20 bg-black/10 rounded-lg flex flex-col items-center justify-center p-1"
                            >
                                <p className="text-xs text-slate-200 text-center truncate w-full">{tab.title}</p>
                                <img
                                    src={tab.favIconUrl ? tab.favIconUrl : 'log.jpeg'} // Fallback to default image
                                    alt={tab.title}
                                    className="w-10 h-10 mt-1"
                                />
                            </div>
                        ))

                    }
                </div>

                <p>
                    {searchQuery}
                </p>


                <Tabs defaultValue={""}>

                </Tabs>
            </div>


        </div>
    )
}

export default App

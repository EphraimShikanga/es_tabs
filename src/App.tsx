import { Tabs } from "@/components/ui/tabs"
import {Input} from "@/components/ui/input.tsx";
import {Search} from "lucide-react";
import {useEffect, useState} from "react";

function App() {
    const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);

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
      <div className={"p-2 h-[500px] w-96"}

style={{backgroundImage: "url('tabss.webp')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat"}}
      >
          <div className={"h-full bg-black rounded-lg p-4 bg-opacity-20 backdrop-filter backdrop-blur-sm"}>
              <div className={"flex flex-row items-end w-full justify-between "}>
                  <div className={"bg-white/10 rounded-full flex flex-row items-end pl-2 "}>
                      <Search color="rgb(226 232 240)" size={"24px"} className={"mb-[6px]"}/>
                      <Input type={"text"} placeholder={"Search tabs..."}
                             className={"placeholder:text-slate-200 pl-2 border-none text-lg text-slate-200 focus-visible:ring-transparent"}/>
                  </div>
                  <div className={"rounded-full h-9 w-12 flex items-center justify-center text-slate-200 bg-white/10"}>
                      <p>
                          {tabs.length}
                      </p>
                  </div>
              </div>
              <div className="flex h-22 w-full p-1 gap-2 overflow-auto">
                  {tabs.slice(0,4).map((tab) => (
                      <div
                          key={tab.id}
                          className="w-20 h-20 bg-white/10 rounded-lg flex flex-col items-center justify-center p-1"
                      >
                          <p className="text-xs text-slate-200 text-center truncate w-full">{tab.title}</p>
                          <img
                              src={tab.favIconUrl ? tab.favIconUrl : 'log.jpeg'} // Fallback to default image
                              alt={tab.title}
                              className="w-10 h-10 mt-1"
                          />
                      </div>
                  ))}
              </div>


              <Tabs defaultValue={""}>

              </Tabs>
          </div>


      </div>
  )
}

export default App

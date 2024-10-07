// We are creating a nice glass morphism effect chrome extension popup
import { Tabs } from "@/components/ui/tabs"
import {Input} from "@/components/ui/input.tsx";
import {Search} from "lucide-react";
import {useState} from "react";

// import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card.tsx";
// import React from "react";

function App() {
    const [tabs, setTabs] = useState(0)
  return (
      // <div className={"p-2 h-96 w-96 bg-gradient-to-tr from-[#001f31] via-[#002e45] to-[#416b6b]"}
      // <div className={"p-2 h-96 w-96 bg-cyan-900"}
      <div className={"p-2 h-[500px] w-96"}

style={{backgroundImage: "url('tabss.webp')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat"}}
      >
            <div className={"h-full bg-black rounded-lg p-4 bg-opacity-20 backdrop-filter backdrop-blur-sm"}>
                <div className={"flex flex-row items-end w-full justify-between "}>
                    <div className={"bg-white/10 rounded-full flex flex-row items-end pl-2 "}>
                    <Search color="rgb(226 232 240)" size={"24px"} className={"mb-[6px]"} />
                    <Input type={"text"} placeholder={"Search tabs..."} className={"placeholder:text-slate-200 pl-2 border-none text-lg text-slate-200 focus-visible:ring-transparent"}/>
                    </div>
                    <div className={"rounded-full h-9 w-12 flex items-center justify-center text-slate-200 bg-white/10"}>
                        <p>
                            {tabs}
                        </p>
                    </div>
                </div>
               <Tabs defaultValue={""}>

               </Tabs>
            </div>



      </div>
  )
}

export default App

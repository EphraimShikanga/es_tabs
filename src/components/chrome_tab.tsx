import React from "react";
import {FolderTree} from "lucide-react";

type ChromeTabProps = {
    tab: chrome.tabs.Tab;
};

const ChromeTab: React.FC<ChromeTabProps> = ({tab}) => {

    const handleTabClick = async (tab: chrome.tabs.Tab) => {
        try {
            await chrome.tabs.update(tab.id!, {active: true});
        } catch (error) {
            console.error("Error updating tab: ", error);
        }

    };


    return (
        <div onClick={() => handleTabClick(tab)}
             aria-label={tab.title}
             className="relative group hover:!opacity-100 group-hover/tabs:opacity-50 min-w-20 w-20 h-20 bg-black/10 rounded-lg flex flex-col items-center justify-center p-1"
        >
            <div
                className="absolute -inset-x-0 -inset-y-0 -z-[2] block rounded-md transition motion-reduce:transition-none group-hover:bg-black/30 group-hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] group-hover:drop-shadow-lg"></div>
            <p className="cursor-default text-xs text-slate-200 text-center truncate w-full">{tab.title}</p>
            <img
                src={tab.favIconUrl ? tab.favIconUrl : "log.jpeg"}
                alt={tab.title}
                className="transition group-hover:animate-bounce-short w-10 h-10 mt-1"
            />

            {tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE && (
                <div className={"absolute left-1.5 bottom-1"}>
                    <FolderTree size={"13px"} color="rgb(226 232 240)"/>
                </div>
            )

            }
        </div>
    );
}

export default ChromeTab;
import React from "react";

type ChromeTabProps = {
    tab: chrome.tabs.Tab;
};

const ChromeTab:React.FC<ChromeTabProps> = ({tab}) => {
    return (
        <div
            className="min-w-20 w-20 h-20 bg-black/10 rounded-lg flex flex-col items-center justify-center p-1"
        >
            <p className="text-xs text-slate-200 text-center truncate w-full">{tab.title}</p>
            <img
                src={tab.favIconUrl ? tab.favIconUrl : "log.jpeg"} // Fallback to default image
                alt={tab.title}
                className="w-10 h-10 mt-1"
            />
        </div>
    );
}

export default ChromeTab;
import React from "react";
import {Tab} from "@material-tailwind/react";

type ExtensionTabProps = {
    value: string;
    activeTab: string;
    onClick: (value: string) => void;
};

const ExtensionTab: React.FC<ExtensionTabProps> = ({value, activeTab, onClick}) => {

    return (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        <Tab
            key={value}
            value={value}
            onClick={() => onClick(value)}
            className={`text-black/50  hover:!opacity-100 group-hover/tab:opacity-50 ${activeTab === value ? "text-[#1e293b]" : ""}`}
        >
            <p>{value}</p>
        </Tab>
    );
}

export default ExtensionTab;
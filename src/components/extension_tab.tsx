import React from "react";
import {Tab} from "@material-tailwind/react";

type ExtensionTabProps = {
    value: string;
    activeTab: string;
    onClick: (value: string) => void;
};

const ExtensionTab: React.FC<ExtensionTabProps> = ({value, activeTab, onClick}) => {

    return (
        <Tab
            key={value}
            value={value}
            onClick={() => onClick(value)}
            className={`text-blue-50 hover:!opacity-100 group-hover/tab:opacity-50 ${activeTab === value ? "text-[#1e293b]" : ""}`}
            placeholder=""
            onPointerEnterCapture={() => {
            }}
            onPointerLeaveCapture={() => {
            }}
        >
            <p>{value}</p>
        </Tab>
    );
}

export default ExtensionTab;
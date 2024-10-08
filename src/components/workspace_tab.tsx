import {Button, List, ListItem, ListItemPrefix, ListItemSuffix, TabPanel, Typography} from "@material-tailwind/react";
import React from "react";
import {Layers, Settings2} from "lucide-react";

type Workspace = {
    title: string;
    tabCount: number;
};

type WorkspaceProps = {
    title: string;
    index: number;
    tabCount: number;
    selected: number;
    onClicked: () => void;
};

type WorkspaceTabProps = {
    value: string;
    selected: number;
    onSelect: (i: number) => void;
    workspaces: Workspace[];
};

const Workspace: React.FC<WorkspaceProps> = ({title, tabCount, index, selected, onClicked}) => {
    return (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
        <ListItem onClick={() => {
            onClicked();
            console.log("clicked", index, selected);
        }} className={`bg-white/20 p-1 ${index === selected ? "bg-white/70" : ""}`}
        >
            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
            {/*@ts-expect-error*/}
            <ListItemPrefix >
                <Layers size={"28px"} color={"#1e293b"}/>
            </ListItemPrefix>
            <div>
                {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                {/*@ts-expect-error*/}
                <Typography variant="h6" color="blue-gray">
                    {title}
                </Typography>
                {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                {/*@ts-expect-error*/}
                <Typography  variant="small" color="blue-gray"
                            className="font-normal">
                    {tabCount} tabs
                </Typography>
            </div>
            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
            {/*@ts-expect-error*/}
            <ListItemSuffix >
                <Settings2 size={"20px"} color={"black"}/>
            </ListItemSuffix>
        </ListItem>
    );

}

const WorkspaceTab: React.FC<WorkspaceTabProps> = ({value, workspaces, selected, onSelect}) => {
    return (
        <TabPanel value={value} className={"h-full"}>
            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
            {/*@ts-expect-error*/}
            <Button

                className="rounded-lg mb-1 p-2 text-xs text-slate-200 bg-[#1e293b] ">
                Add Workspace
            </Button>
            <div className={"max-h-[90%] overflow-y-scroll scrollbar-webkit "}>

                {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                {/*@ts-expect-error*/}
                <List>
                    {
                        workspaces.map((workspace, index) => (
                            <Workspace key={index} index={index} selected={selected} onClicked={() => onSelect(index)} title={workspace.title} tabCount={workspace.tabCount}
                            />
                        ))
                    }

                </List>
            </div>
        </TabPanel>
    );
}


export default WorkspaceTab;
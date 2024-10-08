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
};

type WorkspaceTabProps = {
    value: string;
    workspaces: Workspace[];
};

const Workspace: React.FC<WorkspaceProps> = ({title, tabCount, index}) => {
    return (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
        <ListItem disabled={index === 2} selected={index === 0} onClick={() => {
            console.log("clicked", index);
        }} className={"bg-white/20 p-1"} placeholder={""}
        >
            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
            {/*@ts-expect-error*/}
            <ListItemPrefix placeholder={""} >
                <Layers size={"28px"} color={"#1e293b"}/>
            </ListItemPrefix>
            <div>
                {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                {/*@ts-expect-error*/}
                <Typography placeholder={""} variant="h6" color="blue-gray">
                    {title}
                </Typography>
                {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                {/*@ts-expect-error*/}
                <Typography placeholder={""}  variant="small" color="blue-gray"
                            className="font-normal">
                    {tabCount} tabs
                </Typography>
            </div>
            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
            {/*@ts-expect-error*/}
            <ListItemSuffix placeholder={""} >
                <Settings2 size={"20px"} color={"black"}/>
            </ListItemSuffix>
        </ListItem>
    );

}

const WorkspaceTab: React.FC<WorkspaceTabProps> = ({value, workspaces}) => {
    return (
        <TabPanel value={value} className={"h-full"}>
            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
            {/*@ts-expect-error*/}
            <Button
                placeholder={""}

                className="rounded-lg mb-1 p-2 text-xs text-slate-200 bg-[#1e293b] ">
                Add Workspace
            </Button>
            <div className={"max-h-[90%] overflow-y-scroll scrollbar-webkit "}>

                {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                {/*@ts-expect-error*/}
                <List placeholder={""} >
                    {
                        workspaces.map((workspace, index) => (
                            <Workspace key={index} index={index} title={workspace.title} tabCount={workspace.tabCount}
                            />
                        ))
                    }

                </List>
            </div>
        </TabPanel>
    );
}


export default WorkspaceTab;
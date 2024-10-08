import {Button, List, ListItem, ListItemPrefix, ListItemSuffix, TabPanel, Typography} from "@material-tailwind/react";
import React from "react";
import {Layers, Settings2} from "lucide-react";
import {useWorkspace} from "@/lib/WorkContext.tsx";

type Workspace = {
    id: number;
    title: string;
    tabCount: number;
};

type WorkspaceProps = {
    workspace: Workspace;
};

type WorkspaceTabProps = {
    value: string;
    workspaces: Workspace[];
};

const Workspace: React.FC<WorkspaceProps> = ({workspace}) => {
    const { selected, setSelectedItem } = useWorkspace();
    return (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
        <ListItem onClick={() => {
            setSelectedItem(workspace.id);
            console.log("clicked", workspace.id, selected);
        }} className={`bg-white/20 p-1 ${workspace.id === selected ? "bg-white/70" : ""}`}
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
                    {workspace.title}
                </Typography>
                {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                {/*@ts-expect-error*/}
                <Typography  variant="small" color="blue-gray"
                            className="font-normal">
                    {workspace.tabCount} tabs
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

const WorkspaceTab: React.FC<WorkspaceTabProps> = ({value, workspaces}) => {
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
                            <Workspace key={index} workspace={workspace}/>
                        ))
                    }

                </List>
            </div>
        </TabPanel>
    );
}


export default WorkspaceTab;
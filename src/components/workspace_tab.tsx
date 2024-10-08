import {
    Button,
    Input,
    List,
    ListItem,
    ListItemPrefix,
    ListItemSuffix,
    TabPanel,
    Typography
} from "@material-tailwind/react";
import React, {useState} from "react";
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
    const {selected, setSelectedItem} = useWorkspace();
    return (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        <ListItem onClick={() => {
            setSelectedItem(workspace.id);
        }} className={`bg-white/20 p-1 ${workspace.id === selected ? "bg-white/70" : ""}`}
        >
            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
            {/*@ts-expect-error*/}
            <ListItemPrefix>
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
                <Typography variant="small" color="blue-gray"
                            className="font-normal">
                    {workspace.tabCount} tabs
                </Typography>
            </div>
            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
            {/*@ts-expect-error*/}
            <ListItemSuffix>
                <Settings2 size={"20px"} color={"black"}/>
            </ListItemSuffix>
        </ListItem>
    );

}

type NewWorkspaceProps = {
    newWorkspaceName: string;
    setNewWorkspaceName: (value: string) => void;
};

const NewWorkspace: React.FC<NewWorkspaceProps> = ({newWorkspaceName, setNewWorkspaceName}) => {
    return (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        <ListItem className={`bg-white/50 p-1 hover:bg-white/50 `}>
            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
            {/*@ts-expect-error*/}
            <ListItemPrefix>
                <Layers size={"28px"} color={"#1e293b"}/>
            </ListItemPrefix>
            <div>
                {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                {/*@ts-expect-error*/}
                <Input
                    // label={"Workspace"}
                    variant="static"
                    color={"blue-gray"}
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="Enter workspace name"
                    className="border-none rounded-lg mb-1 p-2 text-[30px] text-bold text-[#1e293b] placeholder:text-blue-gray-600 placeholder:opacity-50"
                />
            </div>
        </ListItem>
    );
}

const WorkspaceTab: React.FC<WorkspaceTabProps> = ({value, workspaces}) => {
    const [isAdding, setIsAdding] = useState(false); // Track if adding a new workspace
    const [newWorkspaceName, setNewWorkspaceName] = useState("");
    const [workspacess, setWorkspaces] = useState([{name: "Test Workspace", tabs: 12}]); // Example initial state

    const handleAddWorkspace = () => {
        setIsAdding(true);
    };

    const handleCreateWorkspace = () => {
        if (newWorkspaceName.trim()) {
            setWorkspaces([...workspacess, {name: newWorkspaceName, tabs: 0}]);
            setNewWorkspaceName("");
            setIsAdding(false);
        }
    };

    const handleCancel = () => {
        setNewWorkspaceName("");
        setIsAdding(false);
    };


    return (
        <TabPanel value={value} className={"h-[92%]"} >
            {isAdding ? (
                <>
                    <div className="flex gap-2">
                        {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                        {/*@ts-expect-error*/}
                        <Button onClick={handleCreateWorkspace} className="bg-green-600">Create</Button>
                        {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                        {/*@ts-expect-error*/}
                        <Button onClick={handleCancel} className="bg-red-600">Cancel</Button>
                    </div>
                </>
            ) : (
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                <Button
                    onClick={handleAddWorkspace}
                    className="rounded-lg mb-1 p-2 text-xs text-slate-200 bg-[#1e293b] ">
                    Add Workspace
                </Button>
            )}

            <div className={"h-[94%] overflow-auto scrollbar-webkit "}>

                {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                {/*@ts-expect-error*/}
                <List>
                    {isAdding && (
                        <NewWorkspace newWorkspaceName={newWorkspaceName} setNewWorkspaceName={setNewWorkspaceName}/>
                    )}
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
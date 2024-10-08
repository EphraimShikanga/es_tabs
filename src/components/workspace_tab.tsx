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
    tabs: chrome.tabs.Tab[];
};

type WorkspaceProps = {
    workspace: Workspace;
};

type WorkspaceTabProps = {
    value: string;
};

const Workspace: React.FC<WorkspaceProps> = ({workspace}) => {
    const {selected, setSelectedItem } = useWorkspace();
    return (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        <ListItem onClick={() => {
            setSelectedItem(workspace.id);
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach((tab) => chrome.tabs.remove(tab.id!));
                workspace.tabs.forEach((tab) => {
                    if (tab.active) {
                        chrome.tabs.create({ url: tab.url }).then(() => {
                            console.log('Tab created successfully');
                        }).catch((error) => {
                            console.error('Error creating tab:', error);
                        });
                    } else {
                        chrome.tabs.create({ url: tab.url, active: false }).then(() => {
                            console.log('Tab created successfully');
                        }).catch((error) => {
                            console.error('Error creating tab:', error);
                        });
                    }
                });
            });


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
                    {workspace.tabs.length} tabs
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
                    style={{width: "100%", fontSize: "24px", color: "black", fontWeight: "bold"}}
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="New Workspace"
                    className="pb-3 pl-3 placeholder:text-[20px] placeholder:text-blue-gray-600 placeholder:opacity-50"
                />
            </div>
        </ListItem>
    );
}

const WorkspaceTab: React.FC<WorkspaceTabProps> = ({value}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState("");
    const {workspaces, setWorkspaces} = useWorkspace();
    const { selected, setSelectedItem } = useWorkspace();

    const handleAddWorkspace = () => {
        setIsAdding(true);
    };

    const handleCreateWorkspace = async () => {
        if (newWorkspaceName.trim()) {

            const currentTabs = await chrome.tabs.query({});
            const updatedWorkspaces = workspaces.map(workspace =>
                workspace.id === selected ? { ...workspace, tabs: currentTabs } : workspace
            );
            await chrome.tabs.create({ url: "chrome://newtab", active: false });
            console.log("Tabs: ", updatedWorkspaces);

            const newId = Math.floor(Math.random() * 1000000);
            setWorkspaces([...updatedWorkspaces, {id:newId, title: newWorkspaceName, tabs: []}]);
            setNewWorkspaceName("");
            setSelectedItem(newId);
            setIsAdding(false);
            await chrome.tabs.create({ url: "chrome://newtab", active: false });
            await Promise.all(currentTabs.map(tab => chrome.tabs.remove(tab.id!)));
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
                        <Button onClick={handleCreateWorkspace} className="rounded-lg mb-1 hover:bg-blue-gray-100/20 p-2 text-xs border border-white text-slate-200 bg-[#1e293b]">Create</Button>
                        {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                        {/*@ts-expect-error*/}
                        <Button onClick={handleCancel} className="rounded-lg hover:bg-blue-gray-900 mb-1 p-2 text-xs text-slate-200 bg-[#1e293b]/70">Cancel</Button>
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
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
    isCurrent: boolean;
};

type WorkspaceProps = {
    workspace: Workspace;
};

type WorkspaceTabProps = {
    value: string;
};

const Workspace: React.FC<WorkspaceProps> = ({workspace}) => {
    // const {selected} = useWorkspace();
    const {workspaces} = useWorkspace();
    return (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        <ListItem onClick={() => {
            console.log(workspace.id);

            chrome.tabs.query({windowType: "normal"}, (tabs) => {
                const updatedWorkspaces = workspaces.map(w =>
                    workspace.id === w.id ? {...w, isCurrent: true} : {...w, tabs: tabs, isCurrent: false}
                );
                // Perform tab-related operations
                // chrome.runtime.sendMessage({ action: "createNewTabAndRemoveCurrent", currentTabs });
                chrome.storage.local.set({'workspaces': updatedWorkspaces}, async () => {
                    console.log("Workspaces saved successfully");
                    if (workspace.tabs.length > 0) {
                        workspace.tabs.forEach((tab) => {
                            chrome.tabs.create({url: tab.url}).then(() => {
                                console.log('Tab created successfully');
                            }).catch((error) => {
                                console.error('Error creating tab:', error);
                            });
                        });
                        tabs.forEach((tab) => chrome.tabs.remove(tab.id!));
                        await new Promise((resolve) => setTimeout(resolve, 5000));
                        workspace.tabs.forEach((tab) => chrome.tabs.discard(tab.id!));
                    } else {
                        await chrome.tabs.create({url: "chrome://newtab", active: true});
                        tabs.forEach((tab) => chrome.tabs.remove(tab.id!));
                    }
                    // setSelectedItem(workspace.id);
                });
            });


        }} className={`bg-white/20 p-1 ${workspace.isCurrent ? "bg-white/70" : ""}`}
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
    // const {selected, setSelectedItem} = useWorkspace();

    const handleAddWorkspace = () => {
        setIsAdding(true);
    };

    const handleCreateWorkspace = async () => {
        if (newWorkspaceName.trim()) {
            const currentTabs = await chrome.tabs.query({windowType: "normal"});

            const updatedWorkspaces = workspaces.map(workspace =>
                workspace.isCurrent ? {...workspace, tabs: currentTabs, isCurrent: false} : workspace
            );
            const newId = Math.floor(Math.random() * 1000000);
            const toSave = [...updatedWorkspaces, {id: newId, title: newWorkspaceName, tabs: [], isCurrent: true}];
            setWorkspaces(toSave);
            setNewWorkspaceName("");
            // setSelectedItem(newId);
            setIsAdding(false);

            // Save to Chrome storage before background operation
            // localStorage.setItem('workspaces', JSON.stringify(updatedWorkspaces));
            chrome.storage.local.set({'workspaces': toSave}, () => {
                console.log("Workspaces saved successfully");
                // Perform tab-related operations
                // chrome.runtime.sendMessage({ action: "createNewTabAndRemoveCurrent", currentTabs });
            });
            await chrome.tabs.create({url: "chrome://newtab", active: true});
            currentTabs.forEach((tab) => chrome.tabs.remove(tab.id!));
            // await Promise.all(currentTabs.map((tab) => chrome.tabs.remove(tab.id!)));
        }
    };


    const handleCancel = () => {
        setNewWorkspaceName("");
        setIsAdding(false);
    };


    return (
        <TabPanel value={value} className={"h-[92%]"}>
            {isAdding ? (
                <>
                    <div className="flex gap-2">
                        {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                        {/*@ts-expect-error*/}
                        <Button onClick={handleCreateWorkspace}
                                className="rounded-lg mb-1 hover:bg-blue-gray-100/20 p-2 text-xs border border-white text-slate-200 bg-[#1e293b]">Create</Button>
                        {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                        {/*@ts-expect-error*/}
                        <Button onClick={handleCancel}
                                className="rounded-lg hover:bg-blue-gray-900 mb-1 p-2 text-xs text-slate-200 bg-[#1e293b]/70">Cancel</Button>
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
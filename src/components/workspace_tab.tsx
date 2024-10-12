import {
    Button,
    IconButton,
    Input,
    List,
    ListItem,
    ListItemPrefix,
    ListItemSuffix,
    TabPanel,
    Typography
} from "@material-tailwind/react";
import React, {useState} from "react";
import {Layers} from "lucide-react";
import {useWorkspace} from "@/lib/WorkContext.tsx";

type Workspace = {
    id: number;
    title: string;
    tabs: chrome.tabs.Tab[];
    groups: chrome.tabGroups.TabGroup[];
    isCurrent: boolean;
};

type WorkspaceProps = {
    workspace: Workspace;
};

type WorkspaceTabProps = {
    value: string;
};

function TrashIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
        >
            <path
                fillRule="evenodd"
                d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
                clipRule="evenodd"
            />
        </svg>
    );
}

const Workspace: React.FC<WorkspaceProps> = ({workspace}) => {
    const [currentWorkspaceTabs, setCurrentWorkspaceTabs] = useState(0);
    const {workspaces, setWorkspaces} = useWorkspace();
    chrome.tabs.query({windowType: "normal"}, (tabs) => {
        setCurrentWorkspaceTabs(tabs.length);
    });


    return (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        <ListItem className={`bg-white/20 p-1 ${workspace.isCurrent ? "bg-white/70" : ""}`}
        >
            <div className={"flex flex-row flex-grow"} onClick={() => {
                chrome.runtime.sendMessage({type: 'switchWorkspace', payload: workspace.id}, (response) => {
                    if (response!.status === 'success') {
                        console.log("clicked", response);
                        // setWorkspaces(response.workspaces);
                    }
                });
                // chrome.tabGroups.query({}, (groups) => {
                //     chrome.tabs.query({windowType: "normal"}, async (tabs) => {
                //         const newTabs: chrome.tabs.Tab[] = [];
                //         // const newGroups: chrome.tabGroups.TabGroup[] = [];
                //         if (workspace.tabs.length > 0) {
                //             workspace.tabs.forEach((tab) => {
                //                 chrome.tabs.create({url: tab.url}).then((t) => {
                //                     newTabs.push({...t, groupId: tab.groupId});
                //                     // newGroups.push(...chrome.tabGroups.query({}));
                //                     console.log('Tab created successfully');
                //                 }).catch((error) => {
                //                     console.error('Error creating tab:', error);
                //                 });
                //             });
                //             tabs.forEach((tab) => chrome.tabs.remove(tab.id!));
                //             // await new Promise((resolve) => setTimeout(resolve, 5000));
                //             // workspace.tabs.forEach((tab) => chrome.tabs.discard(tab.id!));
                //         } else {
                //             await chrome.tabs.create({url: "chrome://newtab", active: true});
                //             tabs.forEach((tab) => chrome.tabs.remove(tab.id!));
                //         }
                //         const updatedWorkspaces = workspaces.map(w => {
                //                 if (workspace.id === w.id) {
                //                     return {...w, isCurrent: true};
                //                 } else if (w.isCurrent) {
                //                     return {...w, tabs: tabs, groups: groups, isCurrent: false};
                //                 } else {
                //                     return w;
                //                 }
                //             }
                //             // workspace.id === w.id ? {...w, tabs: newTabs, isCurrent: true} : {...w, tabs: tabs, groups: groups, isCurrent: false}
                //         );
                //         // TODO: Will handle this and tabs with groups later
                //         chrome.storage.local.set({'workspaces': updatedWorkspaces}, () => {
                //             setWorkspaces(updatedWorkspaces);
                //             newTabs.forEach((tab) => chrome.tabs.discard(tab.id!));
                //             console.log("Workspaces saved successfully");
                //         });
                //     });
                // });
            }}>
                {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                {/*@ts-expect-error*/}
                <ListItemPrefix>
                    <Layers size={"28px"} color={"#1e293b"}/>
                </ListItemPrefix>
                <div className={" flex flex-col"}>
                    {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                    {/*@ts-expect-error*/}
                    <Typography variant="h6" color="blue-gray">
                        {workspace.title}
                    </Typography>
                    {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                    {/*@ts-expect-error*/}
                    <Typography variant="small" color="blue-gray"
                                className="font-normal">
                        {
                            workspace.isCurrent ?
                                currentWorkspaceTabs
                                :
                                workspace.tabs.length
                        } tabs
                    </Typography>
                </div>
            </div>

            {
                workspace.id !== 1 && (
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    <ListItemSuffix>
                        {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                        {/*@ts-expect-error*/}
                        <IconButton size={"md"} variant="text" color="blue-gray" onClick={
                            () => {
                                const updatedWorkspaces = workspaces.filter(w => w.id !== workspace.id);
                                chrome.storage.local.set({'workspaces': updatedWorkspaces}, async () => {
                                    setWorkspaces(updatedWorkspaces);
                                    console.log("Workspace deleted successfully");

                                    if (workspace.isCurrent) {
                                        const defaultWorkspace = updatedWorkspaces.find(w => w.id === 1);
                                        if (defaultWorkspace) {
                                            chrome.tabs.query({windowType: "normal"}, (tabs) => {
                                                tabs.forEach((tab) => chrome.tabs.remove(tab.id!));
                                                defaultWorkspace.tabs.forEach((tab) => {
                                                    chrome.tabs.create({url: tab.url}).then(() => {
                                                        console.log('Tab created successfully');
                                                    }).catch((error) => {
                                                        console.error('Error creating tab:', error);
                                                    });
                                                });

                                            });
                                        }
                                    }
                                });
                            }
                        }>
                            <TrashIcon/>
                        </IconButton>
                    </ListItemSuffix>
                )
            }
        </ListItem>
    );

}

type NewWorkspaceProps = {
    newWorkspaceName: string;
    setNewWorkspaceName: (value: string) => void;
    isDuplicate: boolean;
};

const NewWorkspace: React.FC<NewWorkspaceProps> = ({newWorkspaceName, setNewWorkspaceName, isDuplicate}) => {
    return (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        <ListItem className={`bg-white/50 p-1 hover:bg-white/50 `}>
            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
            {/*@ts-expect-error*/}
            <ListItemPrefix>
                <Layers size={"28px"} color={"#1e293b"}/>
            </ListItemPrefix>
            <div className={"flex flex-col"}>
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
                {
                    isDuplicate && (
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-expect-error
                        <Typography variant="small" color="red">
                            Workspace already exists
                        </Typography>
                    )
                }
            </div>

        </ListItem>
    );
}

const WorkspaceTab: React.FC<WorkspaceTabProps> = ({value}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState("");
    const {workspaces} = useWorkspace();
    const isDuplicate = workspaces.some(workspace => workspace.title === newWorkspaceName.trim());


    const handleAddWorkspace = () => {
        setIsAdding(true);
    };

    const handleCreateWorkspace = () => {
        if (newWorkspaceName.trim()) {
            chrome.runtime.sendMessage({type: 'createNewWorkspace', payload: newWorkspaceName}, (response) => {
                if (response!.status === 'success') {
                    console.log("clicked", response);
                    // setWorkspaces(response.workspaces);
                    setNewWorkspaceName("");
                    setIsAdding(false);
                }
            });
            // chrome.tabGroups.query({}, (groups) => {
            //     chrome.tabs.query({windowType: "normal"}, (tabs) => {
            //         const updatedWorkspaces = workspaces.map(workspace =>
            //             workspace.isCurrent ? {...workspace, tabs: tabs, groups: groups, isCurrent: false} : workspace
            //         );
            //         const newId = Math.floor(Math.random() * 1000000);
            //         const toSave = [...updatedWorkspaces, {
            //             id: newId,
            //             title: newWorkspaceName,
            //             tabs: [],
            //             groups: [],
            //             isCurrent: true
            //         }];
            //         setWorkspaces(toSave);
            //         setNewWorkspaceName("");
            //         setIsAdding(false);
            //
            //         chrome.storage.local.set({'workspaces': toSave}, async () => {
            //             tabs.forEach((tab) => chrome.tabs.remove(tab.id!));
            //             await chrome.tabs.create({url: "chrome://newtab", active: true});
            //         });
            //     });
            // });
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
                        <Button disabled={isDuplicate || !newWorkspaceName.trim()}
                                onClick={() => handleCreateWorkspace()}
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
                        <NewWorkspace isDuplicate={isDuplicate} newWorkspaceName={newWorkspaceName}
                                      setNewWorkspaceName={setNewWorkspaceName}/>
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

import {createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect,} from 'react';

type Workspace = {
    id: number;
    title: string;
    tabs: chrome.tabs.Tab[];
    groups: chrome.tabGroups.TabGroup[];
    isCurrent: boolean;
};

type Workspaces = Record<number, Workspace>;

interface WorkspaceContextType {
    currentWorkspace: Workspace;
    setCurrentWorkspace: (value: Workspace) => void;
    workspaces: Workspaces;
    setWorkspaces: Dispatch<SetStateAction<Workspaces>>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
};


export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace>({ id: 0, title: '', tabs: [], groups: [], isCurrent: false });
    const [workspaces, setWorkspaces] = useState<Workspaces>({});

    useEffect(() => {
        try {
            chrome.runtime.sendMessage({ type: 'fetchWorkspaces' }, (response) => {
                if (response!.workspaces && response!.currentWorkspace) {
                    setWorkspaces(response.workspaces);
                    setCurrentWorkspace(response.currentWorkspace);
                    console.log(response.currentWorkspace);
                }
            });
        } catch (error) {
            console.error('Error fetching workspaces: ', error);
        }
    }, []);


    return (
        <WorkspaceContext.Provider value={{ currentWorkspace, setCurrentWorkspace, workspaces, setWorkspaces }}>
            {children}
        </WorkspaceContext.Provider>
    );
};

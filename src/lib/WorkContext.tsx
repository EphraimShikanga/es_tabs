import {createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect,} from 'react';

type Workspace = {
    id: number;
    title: string;
    tabs: chrome.tabs.Tab[];
    isCurrent: boolean;
};

interface WorkspaceContextType {
    selected: number;
    setSelectedItem: (value: number) => void;
    workspaces: Workspace[];
    setWorkspaces: Dispatch<SetStateAction<Workspace[]>>;
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

const savedWorkspaces = [
    {
        id: 1,
        title: "Default",
        tabs: [],
        isCurrent: true,
    },
]

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
    const [selected, setSelectedItem] = useState<number>(0);
    const [workspaces, setWorkspaces] = useState<Workspace[]>(savedWorkspaces);

    useEffect(() => {
        const loadWorkspaces =  async () => {
            try {
                // const res = localStorage.getItem('workspaces') ? JSON.parse(localStorage.getItem('workspaces')!) : null;
                const result = await chrome.storage.local.get('workspaces')
                // const currentWorkspaces = result.workspaces;
                // const result = await chrome.storage.local.get('workspaces');
                // if (Array.isArray(result.workspaces) && result.workspaces.length > 0) {
                //     setWorkspaces(result.workspaces);

                console.log(result.workspaces);

                if (result.workspaces && result.workspaces.length > 0) {
                    setWorkspaces(result.workspaces);
                    const currentWorkspace = result.workspaces.find((workspace: Workspace) => workspace.isCurrent);
                    if (currentWorkspace) {
                        setSelectedItem(currentWorkspace.id);
                    }
                    console.log('Workspaces loaded:', result.workspaces);
                } else {
                    setSelectedItem(1);
                    console.log('No workspaces found, using default');
                }
            } catch (error) {
                console.error('Error loading workspaces:', error);
            }
        };
        loadWorkspaces().then((r) => r);
    }, []);


    return (
        <WorkspaceContext.Provider value={{ selected, setSelectedItem, workspaces, setWorkspaces }}>
            {children}
        </WorkspaceContext.Provider>
    );
};

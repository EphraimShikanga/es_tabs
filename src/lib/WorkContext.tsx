import {createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect} from 'react';

type Workspace = {
    id: number;
    title: string;
    tabs: chrome.tabs.Tab[];
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
    },
]

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
    const [selected, setSelectedItem] = useState<number>(0);
    const [workspaces, setWorkspaces] = useState<Workspace[]>(savedWorkspaces);
    // Save workspaces to chrome storage whenever they change
    useEffect(() => {
        const saveWorkspaces = async () => {
            try {
                localStorage.set({ "workspaces": workspaces });
                console.log('Workspaces saved:', workspaces);
            } catch (error) {
                console.error('Error saving workspaces:', error);
            }
        };
        if (workspaces.length > 0) {
            saveWorkspaces().then((r) => r);  // Save only if there are workspaces
        }
    }, [workspaces]);

    // Load workspaces from chrome storage on component mount
    useEffect(() => {
        const loadWorkspaces = async () => {
            try {
                const result = localStorage.get("workspaces");
                if (result.workspaces && result.workspaces.length > 0) {
                    setWorkspaces(result.workspaces);
                    console.log('Workspaces loaded:', result.workspaces);
                } else {
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

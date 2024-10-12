import {createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect,} from 'react';

type Workspace = {
    id: number;
    title: string;
    tabs: chrome.tabs.Tab[];
    groups: chrome.tabGroups.TabGroup[];
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


export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
    const [selected, setSelectedItem] = useState<number>(0);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

    useEffect(() => {
        try {
            chrome.runtime.sendMessage({ type: 'fetchWorkspaces' }, (response) => {
                if (response?.workspaces) {
                    setWorkspaces(response.workspaces);
                }
            });
        } catch (error) {
            console.error('Error fetching workspaces: ', error);
        }
    }, []);


    return (
        <WorkspaceContext.Provider value={{ selected, setSelectedItem, workspaces, setWorkspaces }}>
            {children}
        </WorkspaceContext.Provider>
    );
};

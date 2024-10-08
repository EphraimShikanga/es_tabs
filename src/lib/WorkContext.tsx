import { createContext, useState, useContext, ReactNode } from 'react';

interface WorkspaceContextType {
    selected: number;
    setSelectedItem: (value: number) => void;
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

    return (
        <WorkspaceContext.Provider value={{ selected, setSelectedItem }}>
            {children}
        </WorkspaceContext.Provider>
    );
};

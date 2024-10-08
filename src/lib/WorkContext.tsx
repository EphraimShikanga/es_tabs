import { createContext, useState, useContext, ReactNode } from 'react';

// Define the shape of your context
interface WorkspaceContextType {
    selected: number;
    setSelectedItem: (value: number) => void;
}

// Create the context
const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

// Create a custom hook to use the WorkspaceContext
export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
};

// Create the provider component
export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
    const [selected, setSelectedItem] = useState<number>(0);

    return (
        <WorkspaceContext.Provider value={{ selected, setSelectedItem }}>
            {children}
        </WorkspaceContext.Provider>
    );
};

// utils for the background script

type MessageType = 'updateConfig' | 'someOtherAction';

export interface Config {
    [key: string]: any;
    removeFromGroupOnDomainChange?: boolean;
}

export interface Message<T = any> {
    type: MessageType;
    payload?: T; // Define your payload structure based on the message type
}

// Cache for domain -> groupId mapping
export const domainGroupMap: { [domain: string]: number } = {};

// Utility function to sleep for a given amount of time
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Debounce utility function to throttle rapid successive calls
export function debounce<T extends (...args: any[]) => Promise<void> | void>(func: T, wait: number) {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Function to validate configuration
export function validateConfig(newConfig: Config): boolean {
    if (typeof newConfig.removeFromGroupOnDomainChange !== 'boolean') {
        console.error('Invalid config: removeFromGroupOnDomainChange should be a boolean');
        return false;
    }
    return true;
}
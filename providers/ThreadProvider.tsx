"use client"

import { createContext, ReactNode, useContext, useState } from "react"

interface ThreadContextType{
    selectedThreadId : string | null;
    openThread : (messageId :string) => void;
    closeThread : () => void;
    toggleThread : (messageId :string) => void;
    isThreadOpen : boolean;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined)
export function ThreadProvider({children}: {children: ReactNode}){
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

    const [isThreadOpen, setIsthreadOpen] = useState(true);

    const openThread = (messageId : string) => {
        setSelectedThreadId(messageId);
        setIsthreadOpen(true);
    }

    const closeThread = () => {
        setSelectedThreadId(null)
        setIsthreadOpen(false);

    }
    const toggleThread = (messageId : string) => {
        if(selectedThreadId === messageId && isThreadOpen){
            closeThread();
        } else{
            openThread(messageId)
        }
    } 

    const value : ThreadContextType= {
        selectedThreadId, 
        openThread,
        closeThread,
        toggleThread,
        isThreadOpen
    };
    return (
        <ThreadContext.Provider value={value}>{children}</ThreadContext.Provider>

    );
}


//hook reading our content
export function useThread(){
    const context = useContext(ThreadContext)

    if(context === undefined){
        throw new Error('useThread must be used within a ThreadProvider')
    }
    return context;
}


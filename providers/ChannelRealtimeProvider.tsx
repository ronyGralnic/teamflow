import { ChannelEvent, ChannelEventsSchema, RealTimeMessage } from "@/app/schemas/realitme";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import usePartySocket from "partysocket/react";
import {createContext, ReactNode, useContext, useMemo } from "react";

type ChannelRealtimeContextValue = {
    send: (event: ChannelEvent) => void;
}
interface ChannelRealtimeProviderProps{
    channelId : string;
    children : ReactNode;


}

type messageListPage = {items: RealTimeMessage[], nextCursor?: string}
type InfiniteMessages = InfiniteData<messageListPage>

const ChannelRealtimeContext = createContext<ChannelRealtimeContextValue | null>(null);

export function ChannelReattimeProvider({channelId, children}:ChannelRealtimeProviderProps){

    
    const queryClient = useQueryClient()
    
    const socket = usePartySocket({
        host:'https://teamflow-chat-realtime.ronygral1.workers.dev',
        room : `channel-${channelId}`,
        party:"chat",
        onMessage(e){
            try{
                const parsed = JSON.parse(e.data)

                const result = ChannelEventsSchema.safeParse(parsed)

                if(!result.success){
                    console.warn('Invalid channel event')
                    return;
                }

                const event = result.data;

                if (event.type === 'message:created'){
                    const raw = event.payload.message
                    //insert at top of first page of infinte list for the channel
                    queryClient.setQueryData<InfiniteMessages>(["message.list", channelId], (old) => {

                        if(!old){
                            return{
                                pages:[
                                    {
                                        items:[raw],
                                        nextCursor : undefined

                                    }
                                ],
                                pageParams : [undefined]
                            }as InfiniteMessages
                        }

                        const first =old.pages[0]

                        const updatedFirst : messageListPage = {
                            ...first,
                            items: [raw,...first.items]
                        }

                        return {...old, pages: [updatedFirst, ...old.pages.slice(1)]}


                    }) 
                    return;
                }
                if (event.type === 'message:updated'){
                    const updated = event.payload.message

                    //replace the message in the infinite list by id
                    queryClient.setQueryData<InfiniteMessages>(
                        ["message.list", channelId],
                        (old) => {
                            if(!old) return old;

                            const pages = old.pages.map((p)=> ({
                                ...p,
                                items: p.items.map((m)=> 
                                m.id === updated.id ? { ...m, ...updated} : m ), 
                            }));
                            return {...old, pages};


                        }
                    );
                    return;
                }

                if (event.type === "reaction:updated"){
                    const {messageId, reactions} = event.payload;

                    queryClient.setQueryData<InfiniteMessages>(["message.list", channelId], (old)=>{
                        if(!old) return old;

                        const pages = old.pages.map((p) =>({
                            ...p,
                            items:p.items.map((m) => m.id === messageId? {...m, reactions} : m),

                        }));

                        return {...old, pages};
                    })
                    return;
                }

                if(event.type === 'message:replies:increment'){
                    const {messageId, delta } = event.payload;

                    queryClient.setQueryData<InfiniteMessages>(["message.list", channelId], ((old)=> {
                        if(!old) return old;

                        const pages = old.pages.map((p)=>({
                          ...p,
                          items: p.items.map((m)=> m.id === messageId ? {
                            ...m,
                            replyCount: Math.max(0, Number(m.replyCount?? 0 ) + Number(delta))
                          } : m), 
                        }));
                        return {...old, pages};
                    }
                     
                
                ))
                return;
                }



            } catch {
                console.log("something wrnt wrong")

            }
        }

    });

    const value = useMemo<ChannelRealtimeContextValue>(()=> {
        return {
            send : (event) => {
                socket.send(JSON.stringify(event));
            },

        }
    }, [socket]);

    return (
        <ChannelRealtimeContext.Provider value={value}>{children}</ChannelRealtimeContext.Provider>
    )

}

export function useChannelRealtime(): ChannelRealtimeContextValue{
    const ctx = useContext(ChannelRealtimeContext );

    if(!ctx) {
        throw new Error(
            "useChannelRealTime must be used within a channelrealtimeProvider"
        )
    }

    return ctx;

     

}
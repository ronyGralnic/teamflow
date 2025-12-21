"use client"

import { Avatar } from "@/components/ui/avatar"
import { MessageItem } from "./message/MessageItem"
import { useInfiniteQuery, useQuery, useSuspenseQuery } from "@tanstack/react-query"
import { orpc } from "@/lib/orpc"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/general/EmptyState"
import { ChevronDown, Loader2 } from "lucide-react"



export function MessageList(){

    const {channelid} = useParams<{channelid:string}>();
    const [hasInitialScrolled, setHasInitialScrolled] = useState(false);
    const scrollRef =useRef<HTMLDivElement | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const [isAtBottom, setIsAtBottom] = useState(false);
    
    const lastItemIDRef = useRef<string | undefined>(undefined)
    const infiniteOptions = orpc.message.list.infiniteOptions({
        input : (pageParam : string | undefined) => ({
            channelId : channelid,
            cursor : pageParam,
            limit : 30,
        }),

        queryKey: ['message.list', channelid],  

        initialPageParam :  undefined,
        getNextPageParam : (lastPage) => lastPage.nextCursor,
        select : (data) => ({
            pages: [...data.pages].map((p) => ({...p, items: [...p.items].reverse()})).reverse(), 
            pageParams : [...data.pageParams].reverse(),
        }) 
    });
    const {data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, isFetching} = useInfiniteQuery({
        ...infiniteOptions, 
        staleTime : 30_000,
        refetchOnWindowFocus : false,
    });

    const {data : {user}} = useSuspenseQuery(orpc.workspace.list.queryOptions())
    


    //scroll to the botom when messages first loaded
    useEffect(() => {

        if(!hasInitialScrolled && data?.pages.length){
            const el = scrollRef.current

            if (el){
                bottomRef.current?.scrollIntoView({
                    block:'end'
                })
                setHasInitialScrolled(true);
                setIsAtBottom(true);

            }
        }
        
    }, [hasInitialScrolled, data?.pages.length]);

    //keep view pinned to bottom on late content growth (e.g: images)
    useEffect(() => {

        //get the current element
        const el = scrollRef.current;

        //if there is no element, return notihng
        if(!el) return;


        //standeard error function 
        const scrollToBottomIfNeeded = () => {

            //if at the bottom:
            if(isAtBottom || !hasInitialScrolled){

                //a JS func  matching the refresh disply rate 
                //in it alsio a sandard error unction 
                requestAnimationFrame(()=> {
                    bottomRef.current?.scrollIntoView({
                        block:"end"
                    });
                });
            }


        };
        
        const onImageLoad = (e : Event) => {

            if (e.target instanceof HTMLImageElement ){
                scrollToBottomIfNeeded();
            }

        };
        el.addEventListener('load', onImageLoad, true);

         //resizeObserver waches for size changes in the contaner
        const resizeObserver = new ResizeObserver(()=>{
            scrollToBottomIfNeeded()
        });
        resizeObserver.observe(el);

        //mutationObserver waches from DOM changes (eg enages loading content  updates)
        const mutationObserver  = new MutationObserver(() => {
            scrollToBottomIfNeeded();
        });
        mutationObserver.observe(el, {
            childList: true,
            subtree: true,
            attributes:true,
            characterData:true
        });

        return ()=> {
            resizeObserver.disconnect();
            el.removeEventListener('load', onImageLoad, true);
            mutationObserver.disconnect();
        };

    }, [isAtBottom, hasInitialScrolled])

    const isNearBottom = (el: HTMLDivElement) => el.scrollHeight - el.scrollTop - el.clientHeight <= 80;


    const handleScroll = () => {
        const el = scrollRef.current

        if (!el) return;

        if (el.scrollTop <= 80 && hasNextPage && !isFetching){
            const prevScrollHeight =  el.scrollHeight;
            const prevScrollTop = el.scrollTop;

            fetchNextPage().then(() => {
                const newScrollHeight = el.scrollHeight;
                el.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
            });
        }

        setIsAtBottom(isNearBottom(el))
    }

    const items = useMemo( () => {
        return data?.pages.flatMap((p) => p.items) ?? []
    }, [data]);

    const isEmpty = !isLoading && !error && items.length === 0

    useEffect(() =>{

        if(!items.length ) return ;

        const lastId = items[items.length - 1].id;
        const prevLastId = lastItemIDRef.current;

        const el = scrollRef.current;


        if (prevLastId && lastId !== prevLastId){
            if (el && isNearBottom(el)){
                requestAnimationFrame(() =>{
                    el.scrollTop = el.scrollHeight;

                });
                setIsAtBottom(true);


            }
        }
        lastItemIDRef.current = lastId;

    }, [items]);

     const scrollToBottom = () => {
        const el = scrollRef.current;

        if(!el) return;

        bottomRef.current?.scrollIntoView({block:'end', behavior:"smooth"});
        
        setIsAtBottom(true);
     };

    
    return (
        <div className="relative h-full">
            <div className="h-full overflow-y-auto px-4 flex flex-col space-y-1" ref={scrollRef} onScroll={handleScroll}>
                {isEmpty ? (
                    <div className="flex h-full pt-4">
                        <EmptyState title="No messages yet" description="start the conversation by sending the first message" buttonText="send a message" href="#"/>
                    </div>
                ):(
                items?.map((message) => (
                    <MessageItem key={message.id} message={message} currentUserId={user.id}/>
                ))
                )}
                <div ref={bottomRef}></div>

            </div>

            {isFetchingNextPage && (
                <div className="pointer-events-none absolute top-8 left-0 right-0 z-20 flex items-center justify-center py-2">

                    <div className="flex items-center gap-2 spam rounded-md bg-gradient-to-b from-white/80 to-transparent dark:from-neutral-100/80 backdrop-blur px-3 py-1">
                       <Loader2 className="size-4 animate-spin text-muted-foreground"/>
                       <span> Loading Previous Messages...</span> 
                    </div>
                    
                </div>

            )}

            {!isAtBottom && (
                <Button type="button" size="sm"  onClick={scrollToBottom} className="absolute bottom-4 right-5 z-20 size-10 rounded-full hover:shadow-xl transition-all duration-200">
                    <ChevronDown className="size-4"/> 
                </Button>
            )}

{/*
            {newMessages && !isAtBottom ? (
                <Button type="button" className="absolute bottom-4 right-8 rounded-full" onClick={scrollToBottom}>
                    New Messages
                </Button>
            ) : null}
             */}

        </div>
    )
}
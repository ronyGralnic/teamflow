import { Button } from "@/components/ui/button";
import { ChevronDown, MessageSquare, X } from "lucide-react";
import Image from "next/image";
import { ThreadReply } from "./ThreadReply";
import { ThreadReplyForm } from "./ThreadReplyForm";
import { useThread } from "@/providers/ThreadProvider";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { SafeContent } from "@/components/rich-text-editor/SafeContent";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs";
import { ThreadsidebarSkeleton } from "./ThreadSidebarSkeleton";
import { useEffect, useRef, useState } from "react";
import { SummarizeThread } from "./SummarizeThread";


interface ThreadSidebarProps {
    user: KindeUser<Record<string,unknown>>
}

export function ThreadSidebar({user}: ThreadSidebarProps){

    const {selectedThreadId, closeThread} = useThread()

    //for bottom-ing
    const scrollRef =useRef<HTMLDivElement | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const [isAtBottom, setIsAtBottom] = useState(false);

    const lastMessageCounRef = useRef(0)

    const {data, isLoading} = useQuery(
        orpc.message.thread.list.queryOptions({
            input: {
                messageId:selectedThreadId!,

            },
            enabled: Boolean(selectedThreadId)
        })
    );

    const messageCount = data?.messages.length ?? 0

    const isNearBottom = (el: HTMLDivElement) => el.scrollHeight - el.scrollTop - el.clientHeight <= 80;

    const handleScroll = () => {
        const el = scrollRef.current

        if (!el) return;

        setIsAtBottom(isNearBottom(el))
    };

    useEffect(()=>{
        //chec if the message count is not 0:
        //so we got message to scrool from to the bottom:
        if (messageCount === 0) return;

        const prevMessageCount = lastMessageCounRef.current
        //current elelemt
        const el = scrollRef.current;

        if(prevMessageCount> 0 && messageCount !== prevMessageCount){
            if(el && isNearBottom(el) ){
                requestAnimationFrame(()=>{
                    requestAnimationFrame(()=>{
                        bottomRef.current?.scrollIntoView({
                            block:'end',
                            behavior:'smooth',

                        });
                    });
                    setIsAtBottom(true);
                })

            }
        }
        lastMessageCounRef.current = messageCount

    }, [messageCount])

    //keep view pinned to bottom on late content growth (e.g: images)
    useEffect(() => {

        //get the current element
        const el = scrollRef.current;

        //if there is no element, return notihng
        if(!el) return;


        //standeard error function 
        const scrollToBottomIfNeeded = () => {

            //if at the bottom:
            if(isAtBottom ){

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

    }, [isAtBottom]);
    const scrollToBottom = () => {
        const el = scrollRef.current;

        if(!el) return;

        bottomRef.current?.scrollIntoView({block:'end', behavior:"smooth"});
        
        setIsAtBottom(true);
     };

    if(isLoading){
        return <ThreadsidebarSkeleton/>
    }

    return(
        <div className="w-[30rem] border-l flex-col h-full">
            {/* Header */}
            <div className="border-b h-14 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquare className="size-4"/>
                    <span>Thread</span>
                </div>

                <div className="flex items-center gap-2">
                    <SummarizeThread messageId={selectedThreadId!}/>
                    <Button onClick={closeThread} variant="outline" size="icon">
                        <X className="size-4"/>
                    </Button>
                </div>

            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto relative">
                
                <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto">
                    {data && <div className="p-4 border-b bg-muted/20">
                    <div className="flex space-x-3">
                        <Image src={data.parent.authorAvatar} alt="Author Image" width={32} height={32} className="size-8 rounded-full shrink-0"/>

                        <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex items-center space-x-2">
                                <span className="font-medium text-sm">
                                    {data.parent.authorName}
                                </span>

                                <span className="text-xs text-muted-foreground">
                                    {new Intl.DateTimeFormat('en-US', {
                                        hour:'numeric',
                                        minute:'numeric',
                                        hour12:true,
                                        month: 'short',
                                        day:'numeric',

                                    }).format(data.parent.createdAt)
                                    }
                                </span>
                            </div>
                            <SafeContent className="text-sm break-words prose dark:prose-invert max-w-none"content={JSON.parse(data.parent.content)}/>
                                      
                            {/*<p className="text-sm break-words prose dark:prose-invert max-w-none">{messages[0].content}</p>*/}
                        </div>

                        {/*<div className="flex-1 space-y-1 min-w-0">
                            <div className="flex items-center space-x-2">
                                <span className="font-medium text-sm">
                                    {data.parent.authorName}
                                </span>

                                <span className="text-xs text-muted-foreground">
                                    {new Intl.DateTimeFormat('en-US', {
                                        hour:'numeric',
                                        minute:'numeric',
                                        hour12:true,
                                        month: 'short',
                                        day:'numeric',

                                    }).format(data.parent.createdAt)
                                    }
                                </span>
                            </div>
                            <SafeContent className="text-sm break-words prose dark:prose-invert max-w-none" content={JSON.parse(data.parent.content)}/>
                            
                        </div>*/}
                    </div>
                </div>
                }
                
                {/* Scrolll to Botom Buton */}
                {!isAtBottom && (
                    <Button type="button" size="sm"  onClick={scrollToBottom} className="absolute bottom-4 right-5 z-20 size-10 rounded-full hover:shadow-xl transition-all duration-200">
                    <ChevronDown className="size-4"/> 
                    </Button>
                )}
                </div>
                {/* Thread Replies*/}
                <div className="p-2">
                    <p className="text-xs text-muted-foreground mb-3 px-2">
                        {data?.messages.length} Replies
                    </p>

                    <div className="space-y-1">
                        {data?.messages.map((reply) => (
                            <ThreadReply key={reply.id} message={reply} selectedThreadId={selectedThreadId!}/>

                        ))}

                    </div>
                    
                </div>
                <div ref={bottomRef}></div>
            </div>

            {/* Thread reply form */}
            <div className="border-t p-4">
                <ThreadReplyForm user={user} threadId={selectedThreadId!}/>


            </div>

        </div>
    )
}
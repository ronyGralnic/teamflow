"use client"

import { Avatar } from "@/components/ui/avatar"
import { MessageItem } from "./message/MessageItem"
import { useQuery } from "@tanstack/react-query"
import { orpc } from "@/lib/orpc"
import { useParams } from "next/navigation"



export function MessageList(){

    const {channelid} = useParams<{channelid:string}>()

    const {data} = useQuery(
        orpc.message.list.queryOptions({
            input: {
                channelId:channelid,
            },
        })
    )
    return (
        <div className="relative h-full">
            <div className="h-full overflow-y-auto px-4">
                {data?.map((message) => (
                    <MessageItem key={message.id} message={message}/>
                ))}



            </div>

        </div>
    )
}
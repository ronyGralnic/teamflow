"use client"

import { createMessageSchema, CreateMessageSchemaType } from "@/app/schemas/message"
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { MessageComposer } from "../message/MessageComposer"
import { useAttachmentUpload } from "@/hooks/use-attachment-upload"
import { useEffect, useState } from "react"
import { InfiniteData, QueryClient, useMutation, useQueryClient } from "@tanstack/react-query"
import { orpc } from "@/lib/orpc"
import { toast } from "sonner"
import { ImageUp } from "lucide-react"
import { Message } from "@/lib/generated/prisma/client/client"
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs"
import { getAvatar } from "@/lib/get-avatar"
import { messageListItem } from "@/lib/query/types"

interface ThreadReplyFormProps{
    threadId : string;
    user: KindeUser<Record<string , unknown>>;
}


export function  ThreadReplyForm({threadId, user}: ThreadReplyFormProps){

    const { channelid } = useParams<{ channelid: string }>();

    const upload = useAttachmentUpload();

    const [editorKey, setEditorKey] = useState(0)

    const queryClient =useQueryClient()

    const form = useForm({
        resolver : zodResolver(createMessageSchema),
        defaultValues: {
  content: "",
  channelId: channelid,
  threadId,
}

    });

    useEffect(() => {
        form.setValue('threadId', threadId)
    }, [threadId, form])

    const createMessageMutation = useMutation(
        orpc.message.create.mutationOptions({
            //evens we want to listen: onMutate, onsucess, onerror
            
            //onmuate for optimstic update:

            onMutate: async (data) => {
                const listOptions =orpc.message.thread.list.queryOptions({
                    input:{
                        messageId: threadId
                    }
                })
                await queryClient.cancelQueries({queryKey:listOptions.queryKey})
                
                const previous = queryClient.getQueryData(
                    listOptions.queryKey
                );

                type MessagePage = {
                    items : Array<messageListItem>
                    nextCursor? : string
                }

                type InfiniteMessages = InfiniteData<MessagePage>

                const optimstic : Message={
                    id:`opimstic-${crypto.randomUUID()}`,
                    content: data.content,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    authorId : user.id,
                    authorEmail : user.email!,
                    authorName : user.given_name ?? 'John Fisher',
                    authorAvatar:getAvatar(user.picture, user.email!),
                    channelId : data.channelId,
                    threadId : data.threadId!,
                    imageUrl: data.imageUrl ?? null

                };

                queryClient.setQueryData(
                    listOptions.queryKey,
                    (old)=> {
                        if (!old) return old;

                        return{
                            ...old,
                            messages:[...old.messages, optimstic]
                        }
                    }
                );

                //Opimstically bump relies cont in main message list for the parnet meessage :
                queryClient.setQueryData<InfiniteMessages>(

                    ["message.list", channelid],
                    (old) => {
                        if(!old) return old;

                        //if we got old data in our cache:
                        //update it with our new replies count
                        const pages = old.pages.map((page)=>({
                            ...page,
                            items: page.items.map((m) =>(
                                m.id === threadId ? {...m, repliesCount : m.repliesCount+1}: m
                            ))
                        }))

                        return {...old, pages}


                    }
                )

                return {
                    listOptions, 
                    previous
                }
            },


            onSuccess : (_data, _vars, ctx) => {


                queryClient.invalidateQueries({queryKey: ctx.listOptions.queryKey})

                form.reset({
  channelId: channelid,
  content: "",
  threadId,
});

                upload.clear();
                setEditorKey((k)=> k+1);
                return toast.success("Message Created Successfully!");

            },
            onError : (_err, _vars, ctx) => {
                if (!ctx) return;

                const {listOptions, previous} = ctx
                if (previous) {
                    queryClient.setQueryData(
                        listOptions.queryKey,
                        previous
                        
                    )
                }



                toast.error('Something went wrong')
            }

        })
    )

    function onSubmmit(data: CreateMessageSchemaType){
        createMessageMutation.mutate({
            //add date and inage url:
            ...data,
            imageUrl : upload.stagedUrl ?? undefined,
             threadId: threadId ?? undefined,

        })
    }

    return(
        //create the form:
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmmit)}>

                <FormField control={form.control} name="content" render = {({field}) => (
                    <FormItem>
                        <FormControl>
                            <MessageComposer 
                            value={field.value} 
                            onChange={field.onChange} 
                            upload={upload}
                            key={editorKey} 
                            onSubmit={() => form.handleSubmit(onSubmmit)()}
                            isSubmitting={createMessageMutation.isPending}

                             />
                        </FormControl>
                    </FormItem>
                )

                }/>


            </form>
        </Form>
    )
}
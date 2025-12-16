"use client"

import { createMessageSchema, CreateMessageSchemaType,  } from "@/app/schemas/message";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { MessageComposer } from "./MessageComposer";
import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { toast } from "sonner";
import { useState } from "react";
import { useAttachmentUpload } from "@/hooks/use-attachment-upload";
import { Message } from "@/lib/generated/prisma/client/client";
import { userAgent } from "next/server";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs";
import { getAvatar } from "@/lib/get-avatar";


interface iAppProps {
    channelId : string;
    user: KindeUser<Record<string, unknown>>;
}

type messagePage ={
    items:Message[];
    nextCursor?: string
     
};

type InfiniteMessages = InfiniteData<messagePage >

export function MessageInputForm({channelId, user}: iAppProps){


    const queryClient = useQueryClient();

    const [editorKey, setEditorKey] = useState(0);

    const upload = useAttachmentUpload();


    
    

    const form = useForm({
        resolver: zodResolver(createMessageSchema),
        defaultValues : {
            channelId :  channelId,
            content : "",
        },
    });

    const createMessageMutation = useMutation(
        orpc.message.create.mutationOptions({

            onMutate : async (data) => {

                await queryClient.cancelQueries({
                    queryKey: ['message.list', channelId]
                });

                const previousData = queryClient.getQueryData<InfiniteMessages>([
                    "message.list",
                    channelId,
                ]);

                const tempId = `optimsic-${crypto.randomUUID()}`

                const optimsticMessage : Message = {

                    id : tempId,
                    content :data.content,
                    imageUrl: data.imageUrl ?? null,
                    createdAt:new Date(),
                    updatedAt : new Date(),
                    authorId: user.id,
                    authorEmail : user.email!,
                    authorName : user.given_name ?? 'John Doe',
                    authorAvatar : getAvatar(user.picture, user.email!),
                    channelId: channelId,

                };
                 
                queryClient.setQueryData<InfiniteMessages>(["message.list", channelId], (old) => {
                    if(!old){
                        return {
                            pages : [
                                {
                                    items: [optimsticMessage],
                                    nextCursor: undefined

                                }
                            ],
                            pageParams : [undefined],
                        } satisfies InfiniteMessages;

                    }

                    const firstPage = old.pages[0] ?? {
                        items : [],
                        nextCursor: undefined,
                    };
                    
                    const updatedFirsPage : messagePage = {
                        ...firstPage, 
                        items : [optimsticMessage, ...firstPage.items],

                    };
                    return {
                        ...old,
                        pages : [updatedFirsPage, ...old.pages.slice(1)],
                    }
                }


                );

                //reurnig prev data and temp id: 
                return {
                    previousData,
                    tempId
                }

            }, 


            onSuccess : (data, _variables, context) => {

                queryClient.setQueryData<InfiniteMessages>(
                    ["message.list", channelId],
                    (old) => {

                        if(!old) return old;

                        const updatedPages = old.pages.map((page) => ({
                            ...page,
                            items : page.items.map((m) => m.id === context.tempId ? {
                                ...data,
                            }:m),

                        })) ;

                        form.reset({channelId, content:""})
                        upload.clear();
                        setEditorKey((k) => k+1);


                        return  {...old, pages: updatedPages}
                    }
                )
                


                return toast.success("message created successfully");

            },
            onError : (_err, _variables, context ) => {
                if(context?.previousData){
                    queryClient.setQueryData(
                        ["message.list", channelId], context.previousData
                    )

                }

                return toast.error("something went wrong")

            }
        })
    )
    function onSubmit(data: CreateMessageSchemaType) {

        createMessageMutation.mutate({
            ...data,
            imageUrl:upload.stagedUrl ?? undefined,

        })
    }
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} >
                <FormField

                    control={form.control}
                    name="content"
                    render={({field}) => (
                        <FormItem>
                            <FormControl>
                                <MessageComposer key = {editorKey} value={field.value} onChange={field.onChange} onSubmit={() => onSubmit(form.getValues())} isSubmitting={createMessageMutation.isPending} upload={upload}/>
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )
                         
                    }
                
                
                />
            </form>
        </Form>
    )
}
import { updateMessageSchema, updateMessageSchemaType } from "@/app/schemas/message"
import { RichTextEditor } from "@/components/rich-text-editor/Editor"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Message } from "@/lib/generated/prisma/client/client"
import { orpc } from "@/lib/orpc"
import { zodResolver } from "@hookform/resolvers/zod"
import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query"
import {  useForm } from "react-hook-form"
import { toast } from "sonner"

interface EditMessageProps{
    message : Message;
    onCancel : () => void;
    onSave : () => void;
}

export function EditMessage({message, onCancel,onSave} : EditMessageProps) {

    const queryClient = useQueryClient()


    const form =useForm({

        resolver : zodResolver(updateMessageSchema),
        defaultValues:{
            messageId:message.id,
            content:message.content
        }
    });

    const updateMuation = useMutation(
        orpc.message.update.mutationOptions({
            onSuccess: (updated) => {
                //revalidating my data: 
                //mostly refetching by invalidaion queries
                // but not good for infinitequeries,
                // cause with 50000 message there refecing will be all that!
                // not sclable
                //so needing scalable invalidationg data without refeching it all
                //how? when all data is being loaded: stored at the serber-side-cache
                //so create surgical caceh update: replace he updated message
                //in the infinite list  no huge refeching happened

                //create type:
                type MessagePage = {items: Message[], nextCursor?: string}
                type InfinieMessages = InfiniteData<MessagePage>
                
                queryClient.setQueryData<InfinieMessages>(
                    ["message.list", message.channelId],
                    (old) => {
                        if(!old) return old;

                        const updatedMessage = updated.message

                        //old data is existing, so:
                        //update the cache surgically:
                        const pages = old.pages.map((page) => ({
                            ...page,
                            items: page.items.map((m) => m.id === updatedMessage.id ? {...m, ...updatedMessage}: m),
                        }));
                    
                    return {
                        ...old, 
                        pages
                    };
                }
                );
                toast.success("Message updated succseefully")
                onSave();

            },
            onError: (error) =>{
                toast.error(error.message)
            }
        })
    )

    function onSubmit(data: updateMessageSchemaType){

        updateMuation.mutate(data);

    }
    return(
        //a form compo init will be there is RTE

        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                control={form.control} 
                name="content"
                render={({field}) =>(
                    <FormItem>
                        <FormControl>
                            <RichTextEditor
                            field={field}
                            sendButton={
                                <div className="flex itms-center gap-4">
                                    <Button onClick={onCancel} type="button" size="sm" variant="outline" disabled={updateMuation.isPending}>Cancel</Button>
                                    <Button disabled={updateMuation.isPending} type="submit" size="sm">
                                        {updateMuation.isPending ? 'Saving...': 'Save'}
                                    </Button>



                                </div>
                            }
                            />
                
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
            )}
            />
             
                

            </form>

        </Form>
    )
}
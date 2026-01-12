import { inviteMemberSchema, inviteMemberSchemaType } from "@/app/schemas/member";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { orpc } from "@/lib/orpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { DialogTitle, DialogTrigger } from "@radix-ui/react-dialog";
import { useMutation } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

 export default function InviteMember(){

    const [open, setOpen] = useState(false);

    const form = useForm({
        resolver : zodResolver(inviteMemberSchema),
        defaultValues: {
            email:"",
            name: "",
        }
    });
    //creating mutation for the inviation prcodrue so
    //i wool br listening to 2 events: onSUcces and on 
    //on the on error,

    const inviteMutation = useMutation(

        orpc.workspace.member.invite.mutationOptions({

            onSuccess: () => {
                //a callback : returning a toast,  rset the form
                //close the dialog

                //toasting:
                toast.success(`Inviation sent successfully!`)
                form.reset();
                setOpen(false);
            },
            onError :(error) => {
                toast.error(error.message);                
            }

        })
    )
    function onSubmit(values: inviteMemberSchemaType ){

         //so basically  while submiting the inviation, 
         // calling the mutation function:
         inviteMutation.mutate(values);
    } 
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                 <Button variant="outline">
                    <UserPlus/>
                    Invite Member

                 </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[524px">
                <DialogHeader>
                    <DialogTitle>
                        Invite Member
                    </DialogTitle>
                    <DialogDescription>
                        Invite a new member to your workspace by using their email
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField control={form.control} name="name" render={({field}) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <input placeholder="Enter Name..." {...field}/>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}/>

                        <FormField control={form.control} name="email" render={({field}) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <input placeholder="Enter Email Address..." {...field}/>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}/>

                        <Button type="submit">
                            Send Invitation

                        </Button>
                    </form>
                    
                </Form>
                
            </DialogContent>

        </Dialog>
    )
 }
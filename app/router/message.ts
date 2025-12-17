import z from "zod";
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard";
import { writeSecurityMiddleware } from "../middlewares/arcjet/write";
import { requiredAuthMiddleware } from "../middlewares/auth";
import { base } from "../middlewares/base";
import { requiredWorkspaceMiddleware } from "../middlewares/workspace";
import prisma from "@/lib/db";
import { createMessageSchema, updateMessageSchema } from "../schemas/message";
import { getAvatar } from "@/lib/get-avatar";
import { Message } from "@/lib/generated/prisma/client/client";
import { readSecurityMiddleware } from "../middlewares/arcjet/read";
import { error } from "console";

export const createMessage = base
.use(requiredAuthMiddleware)
.use(requiredWorkspaceMiddleware)
.use(standardSecurityMiddleware)
.use(writeSecurityMiddleware)
.route({
    method: 'POST',
    path: '/message',
    summary: 'Create a message',
    tags: ["Messages"],

})
.input(createMessageSchema)
.output(z.custom<Message>())
.handler(async ({input, context, errors}) => {

    //verify the channel belongs to the user's organization
    const channel = await prisma.channel.findFirst({
        where : {
            id: input.channelId,
            workspaceId: context.workspace.orgCode,
        },
    });

    if(!channel){
        throw errors.FORBIDDEN();
    }

    const created = await prisma.message.create({
        data : {
            content : input.content,
            imageUrl : input.imageUrl,
            channelId :input.channelId,
            authorId : context.user.id,
            authorEmail : context.user.email!,
            authorName :  context.user.given_name ?? "John Doe",
            authorAvatar : getAvatar( context.user.picture, context.user.email!)

        },
    });

    return {
        ...created
    }
});

export const listMessages = base
.use(requiredAuthMiddleware)
.use(requiredWorkspaceMiddleware)
.use(standardSecurityMiddleware)
.use(readSecurityMiddleware)
.route({
    method: 'GET',
    path: '/messages',
    summary: 'List all messages',
    tags: ['Messages'],
}).input(z.object({
    channelId : z.string(),
    limit : z.number().min(1).max(100).optional(),
    cursor: z.string().optional(),
}))
.output(z.object({
    items: z.array(z.custom<Message>()),
    nextCursor : z.string().optional(),
}))
.handler(async ({input, context, errors}) => {
    const channel = await prisma.channel.findFirst({

        where: {

            id: input.channelId,
            workspaceId : context.workspace.orgCode,
        },


    });
    if(!channel){
        throw errors.FORBIDDEN();
    }

    
    const limit = input.limit ?? 30;


    const messages = await prisma.message.findMany({
        where:{
            channelId : input.channelId,

        },
        ...(input.cursor ?{
            cursor:{id: input.cursor},
            skip : 1
        } : {}),
        take: limit,
        orderBy : [{createdAt : 'desc'}, {id: 'desc'}],

    });
    const nextCursor = messages.length === limit ? messages[messages.length - 1].id : undefined

    return {

        items : messages,
        nextCursor
    }
})

export const updateMessage = base
.use(requiredAuthMiddleware)
.use(requiredWorkspaceMiddleware)
.use(standardSecurityMiddleware)
.use(writeSecurityMiddleware)
.route({
    method:'PUT',
    path:'/messages/:messageId',
    summary: 'Update a message',
    tags: ["Messages"]
})
.input(updateMessageSchema)
.output(z.object({
    message : z.custom<Message>(),
    canEdit : z.boolean()
    
}))
.handler(async ({input, context,errors}) => {
    const message = await prisma.message.findFirst({
        where:{
            //find allmessage from a spesfic messageid, and 
            //want to verfiy that it belong o he orgnantiztopn with the channel
            id: input.messageId,
            channel: {
                workspaceId: context.workspace.orgCode
            },
        },
        select:{
            //just need to authorId, and the id
            id: true,
            authorId: true,
        },
    });
    if(!message){
        throw errors.NOT_FOUND();
    }

    //verfiy that the authorID matches the userID: so only yhe creator shoud edit
    if(message.authorId !== context.user.id) {

        //a user trying to edit amessage that is not theirs
        throw errors.FORBIDDEN();


    }


    //if we get here: the user is verified!
    const updated = await prisma.message.update({
        where:{
            id: input.messageId
        },
        data:{
            content: input.content
        }
    });

    //return he data:
    return{
        message: updated,
        // a boolean inticading does the user can edit 
        canEdit: updated.authorId === context.user.id
    }
})


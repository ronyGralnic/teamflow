import z from "zod";
import { heavyWriteSecurityMiddleware } from "../middlewares/arcjet/heavy-write";
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard";
import { requiredAuthMiddleware } from "../middlewares/auth";
import { base } from "../middlewares/base";
import { requiredWorkspaceMiddleware } from "../middlewares/workspace";
import { inviteMemberSchema } from "../schemas/member";
import { init, organization_user, Organizations, Users } from "@kinde/management-api-js";
import { getAvatar } from "@/lib/get-avatar";
import { readSecurityMiddleware } from "../middlewares/arcjet/read";
import { error } from "console";

export const inviteMember = base
.use(requiredAuthMiddleware)
.use(requiredWorkspaceMiddleware)
.use(standardSecurityMiddleware)
.use(heavyWriteSecurityMiddleware)
.route({
    method : 'POST',
    path : `/workspace/members/invite`,
    summary: "Invite Member",
    tags: ["Members"],
})
.input(inviteMemberSchema)
.output(z.void())
.handler(async ({input, context,errors}) => {
    //start inviting user

    //first try: by kinde cause is our auth logic
    //maybe: getKindeServerSession hook? 
    // no, just authed not invite/delete

    //we need the tokens:
    try{
        //using the kinde managemt API: the JS wrapper
        
        
        init()

        //the flow:
        //user created by us by kinde
        //han his user will be created in the workspace
        //right now only new users can be added to the workspace, 
        //not existing users
        await Users.createUser({

            requestBody:{

                //why needed? because we are creating user by kinde
                //then addind it to he organization
                 
                organization_code : context.workspace.orgCode,
                
                //for its profile: name and avaar:
                profile:{
                    given_name : input.name,
                    picture: getAvatar(null, input.email)
                },

                identities:[
                    {
                        //passing in how will the user will be login : email
                        type: "email",
                        details:{
                            email: input.email,

                        }
                    }
                ]


            }
        })
        
    }catch {
        //console.log(errors)
        throw errors.INTERNAL_SERVER_ERROR();
         

    }

});

export const listMembers = base
.use(requiredAuthMiddleware)
.use(requiredWorkspaceMiddleware)
.use(standardSecurityMiddleware)
.use(readSecurityMiddleware)
.route({
    method: "GET",
    path:"/workspace/members",
    summary : "List all members",
    tags : ["Members"]
})
.input(z.void())
.output(z.array(z.custom<organization_user>()))
.handler(async ({context, errors}) => {
    //i want to get all thw organization users
    //using kinde mamnagment API 
    //namely :  with the JS helper wrraper 

    try{


        //initialize the kinde manamgement API
        init()

        //using kinde managment API to get data:
        const data = await Organizations.getOrganizationUsers({
            orgCode: context.workspace.orgCode,
            sort: `name_asc`
        });

        //if there is no users in a fetched organization, throw error:
        if (!data.organization_users){
            throw errors.NOT_FOUND();
        }

        return data.organization_users

    } catch {
        throw errors.INTERNAL_SERVER_ERROR();
    }

})


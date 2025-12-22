import { GroupedReactionSchemaType } from "@/app/schemas/message";
import { Message } from "../generated/prisma/client/client";


export type messageListItem = Message & {
    replyCount : number;
    reactions : GroupedReactionSchemaType[];

}
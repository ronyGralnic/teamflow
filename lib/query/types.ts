import { Message } from "../generated/prisma/client/client";


export type messageListItem = Message & {
    repliesCount : number;

}
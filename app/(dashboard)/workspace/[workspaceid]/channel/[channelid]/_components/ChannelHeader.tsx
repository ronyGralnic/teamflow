import { THemeToggle } from "@/components/ui/theme-toggle";
import InviteMember from "./member/InviteMember";
import { MemberOveriew } from "./member/MemberOverview";

interface ChannelHeaderprops {
    channelName : string | undefined;
}

export function ChannelHeader( { channelName} : ChannelHeaderprops) {
    return (
        <div className="flex items-center justify-between h-14 px-4 border-b">
            <h1 className="text-lg font-semibold">
                #{channelName}
            </h1>


            <div className="flex items-center space-x-3">
                <MemberOveriew/>
                <InviteMember/>
                <THemeToggle/>

            </div>
        </div>
    )
}
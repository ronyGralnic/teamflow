import { Button } from "@/components/ui/button";
import { MessageSquareText, Pencil } from "lucide-react";

interface toolbarProps{
    messageId : string;
    canEdit : boolean;
    onEdit : () => void;
}

export function MesssageHoverToolbar({canEdit, onEdit,messageId}:toolbarProps){
    //render it on the right corner:
    return (
        <div className="
  absolute right-2 top-3
  flex items-center gap-1
  rounded-md border border-gray-200
  bg-white/95 px-0.5 py-1 shadow-sm
  backdrop-blur transition-opacity
  opacity-0 group-hover:opacity-100
  dark:border-neutral-800 dark:bg-neutral-900/90
">

            {canEdit && <Button variant="ghost" size="icon" type="button" onClick={onEdit}>
                <Pencil className="size-4" />
            </Button>}

            <Button variant="ghost" size="icon">
                <MessageSquareText className="size-4"/>
            </Button>
            
        </div>
    )
}
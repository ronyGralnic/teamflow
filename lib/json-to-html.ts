import { baseExtensions } from "@/components/rich-text-editor/extensions";
import {generateHTML, type JSONContent } from "@tiptap/react";

export function convertJsonToHtml(JsonContent: JSONContent): string{
    try{

        const content = typeof JsonContent === 'string'? JSON.parse(JsonContent) : JsonContent
        
        return generateHTML(content, baseExtensions)
    }catch{

        console.log('Error converting json to html');
        return "";
    }
}
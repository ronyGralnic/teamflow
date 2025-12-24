import MarkdownIT from 'markdown-it'
import DOMPurify from 'dompurify' 
import { editorExtentions } from '@/components/rich-text-editor/extensions';
import { generateJSON } from '@tiptap/react';

const md = new MarkdownIT({html: false, linkify: true, breaks: false});

export function markdownToJson(markdown:string){
    const html = md.render(markdown);

    //sanitize and use the html, o generae json:
    const cleanHml = DOMPurify.sanitize(html, {USE_PROFILES: {html:true}})

    return generateJSON(cleanHml, editorExtentions)
}
    

"use client";

import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { Bold, Code, Heading2, Italic, Link2, List, ListOrdered, Quote, Undo2, Redo2 } from "lucide-react";

interface NewsEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const buttonClass = "rounded p-2 text-slate-600 hover:bg-slate-100 aria-pressed:bg-emerald-100 aria-pressed:text-emerald-800";

export function NewsEditor({ value, onChange, error }: NewsEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" } }),
    ],
    content: value,
    editorProps: {
      attributes: { class: "prose prose-slate max-w-none min-h-64 px-4 py-3 focus:outline-none" },
    },
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
  });

  const addLink = () => {
    const href = window.prompt("Paste a URL");
    if (href) editor?.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  if (!editor) return <div className="min-h-64 animate-pulse rounded-xl border bg-slate-50" />;

  return <div className={error ? "rounded-xl border border-red-500 bg-white" : "rounded-xl border bg-white"}>
    <div className="flex flex-wrap gap-1 border-b p-2" role="toolbar" aria-label="Article formatting">
      <button type="button" aria-label="Bold" aria-pressed={editor.isActive("bold")} className={buttonClass} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={18} /></button>
      <button type="button" aria-label="Italic" aria-pressed={editor.isActive("italic")} className={buttonClass} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={18} /></button>
      <button type="button" aria-label="Heading" aria-pressed={editor.isActive("heading", { level: 2 })} className={buttonClass} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={18} /></button>
      <button type="button" aria-label="Bullet list" aria-pressed={editor.isActive("bulletList")} className={buttonClass} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={18} /></button>
      <button type="button" aria-label="Numbered list" aria-pressed={editor.isActive("orderedList")} className={buttonClass} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={18} /></button>
      <button type="button" aria-label="Quote" aria-pressed={editor.isActive("blockquote")} className={buttonClass} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={18} /></button>
      <button type="button" aria-label="Code" aria-pressed={editor.isActive("code")} className={buttonClass} onClick={() => editor.chain().focus().toggleCode().run()}><Code size={18} /></button>
      <button type="button" aria-label="Add link" className={buttonClass} onClick={addLink}><Link2 size={18} /></button>
      <button type="button" aria-label="Undo" className={buttonClass} onClick={() => editor.chain().focus().undo().run()}><Undo2 size={18} /></button>
      <button type="button" aria-label="Redo" className={buttonClass} onClick={() => editor.chain().focus().redo().run()}><Redo2 size={18} /></button>
    </div>
    <EditorContent editor={editor} />
    {error && <p className="px-4 pb-3 text-sm text-red-600">{error}</p>}
  </div>;
}

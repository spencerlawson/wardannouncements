"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading2,
  Heading3,
} from "lucide-react";
import { useEffect } from "react";

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  readOnly?: boolean;
}

export function TipTapEditor({ content, onChange, readOnly = false }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
    ],
    content,
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="border rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-ring">
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-muted/50 border-b">
          <Button
            type="button"
            variant={editor.isActive("bold") ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("italic") ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-5 mx-0.5" />

          <Button
            type="button"
            variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="h-3.5 w-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-5 mx-0.5" />

          <Button
            type="button"
            variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-5 mx-0.5" />

          <Button
            type="button"
            variant={editor.isActive({ textAlign: "left" }) ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive({ textAlign: "center" }) ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive({ textAlign: "right" }) ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight className="h-3.5 w-3.5" />
          </Button>

        </div>
      )}
      <EditorContent
        editor={editor}
        className={`
          prose prose-sm max-w-none p-4 min-h-[200px]
          [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[180px]
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0
        `}
      />
    </div>
  );
}

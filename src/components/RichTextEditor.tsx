import { useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import { uploadMedia } from "../lib/media";

const FONTS = [
  { label: "Default", value: "" },
  { label: "Barlow", value: "Barlow, sans-serif" },
  { label: "Barlow Condensed", value: "'Barlow Condensed', sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Oswald", value: "Oswald, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Monospace", value: "monospace" },
];

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export default function RichTextEditor({ value, onChange, placeholder = "Write your article here…" }: Props) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false, allowBase64: false }),
      TextStyle,
      FontFamily,
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "na-body-editor" },
    },
  });

  if (!editor) return null;

  const setLink = () => {
    const prevUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL", prevUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertImage = async (file: File | undefined | null) => {
    if (!file) return;
    try {
      const res = await uploadMedia(file);
      editor.chain().focus().setImage({ src: res.url, alt: file.name }).run();
    } catch (err) {
      console.error("Inline media upload failed:", err);
    }
  };

  return (
    <div className="na-body-wrap">
      <div className="na-toolbar">
        <button type="button" className={`na-tool-btn ${editor.isActive("bold") ? "active" : ""}`} onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
        <button type="button" className={`na-tool-btn ${editor.isActive("italic") ? "active" : ""}`} style={{ fontStyle: "italic" }} onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
        <button type="button" className={`na-tool-btn ${editor.isActive("heading", { level: 1 }) ? "active" : ""}`} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
        <button type="button" className={`na-tool-btn ${editor.isActive("heading", { level: 2 }) ? "active" : ""}`} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button type="button" className={`na-tool-btn ${editor.isActive("heading", { level: 3 }) ? "active" : ""}`} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
        <button type="button" className="na-tool-btn" onClick={() => editor.chain().focus().setHorizontalRule().run()}>—</button>
        <button type="button" className={`na-tool-btn ${editor.isActive("link") ? "active" : ""}`} onClick={setLink}>Link</button>
        <button type="button" className={`na-tool-btn ${editor.isActive("blockquote") ? "active" : ""}`} onClick={() => editor.chain().focus().toggleBlockquote().run()}>Quote</button>
        <span style={{ width: 1, alignSelf: "stretch", background: "#e2e4e8", margin: "0 4px" }} />
        <select
          className="na-tool-font-select"
          defaultValue=""
          onChange={e => {
            const font = e.target.value;
            if (font) editor.chain().focus().setFontFamily(font).run();
            else editor.chain().focus().unsetFontFamily().run();
          }}
        >
          {FONTS.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
        </select>
        <button type="button" className="na-tool-btn" onClick={() => imageInputRef.current?.click()}>🖼️ Media</button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={e => { insertImage(e.target.files?.[0]); e.target.value = ""; }}
        />
      </div>
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  );
}
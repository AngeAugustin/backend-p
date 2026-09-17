"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table/kit";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Columns2,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Redo2,
  Rows2,
  Strikethrough,
  Table,
  TableCellsMerge,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
  Unlink,
} from "lucide-react";
import { adminUpload } from "@/lib/admin-client";
import {
  ResizableImage,
  type ImageAlign,
} from "@/lib/tiptap-resizable-image";
import {
  ArticleTextAlign,
  type TextAlignment,
} from "@/lib/tiptap-text-align";
import { cn } from "@/lib/utils";

function normalizeHtml(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed === "<p></p>" || trimmed === "<p><br></p>") return "";
  return trimmed;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-40",
        active && "bg-primary/10 text-primary"
      )}
    >
      {children}
    </button>
  );
}

function ToolbarLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mx-0.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
      {children}
    </span>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Rédige le contenu…",
  minHeightClass = "min-h-[220px]",
  imageFolder = "articles",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeightClass?: string;
  imageFolder?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      ResizableImage,
      ArticleTextAlign,
      TableKit.configure({
        table: {
          resizable: true,
          HTMLAttributes: {
            class: "richtext-table",
          },
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: cn(
          "richtext-editor prose prose-sm max-w-none px-3.5 py-3 text-sm leading-relaxed text-foreground outline-none",
          "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
          "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic",
          "[&_a]:text-glow [&_a]:underline",
          "[&_mark]:rounded-sm [&_mark]:bg-amber-200/80 [&_mark]:px-0.5",
          "[&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-bold",
          "[&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold",
          "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-lg [&_table]:border [&_table]:border-border",
          "[&_th]:border [&_th]:border-border [&_th]:bg-secondary/70 [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold",
          "[&_td]:border [&_td]:border-border [&_td]:px-2.5 [&_td]:py-1.5",
          "[&_.selectedCell]:bg-primary/10",
          "[&_p.is-editor-empty:first-child::before]:pointer-events-none [&_p.is-editor-empty:first-child::before]:float-left [&_p.is-editor-empty:first-child::before]:h-0 [&_p.is-editor-empty:first-child::before]:text-muted-foreground [&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          minHeightClass
        ),
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(normalizeHtml(current.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = normalizeHtml(editor.getHTML());
    const next = normalizeHtml(value || "");
    if (current === next) return;

    // TipTap setContent uses flushSync; defer so it doesn't run during React render.
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled || !editor) return;
      const stillCurrent = normalizeHtml(editor.getHTML());
      const stillNext = normalizeHtml(value || "");
      if (stillCurrent === stillNext) return;
      editor.commands.setContent(value || "", { emitUpdate: false });
    });

    return () => {
      cancelled = true;
    };
  }, [editor, value]);

  if (!editor) {
    return (
      <div
        className={cn(
          "rounded-xl border border-input bg-card",
          minHeightClass
        )}
      />
    );
  }

  function setLink() {
    const previous = editor?.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL du lien", previous || "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
  }

  function insertImageByUrl() {
    if (!editor) return;
    const url = window.prompt("URL de l’image", "https://");
    if (!url?.trim()) return;
    editor
      .chain()
      .focus()
      .insertContent({
        type: "image",
        attrs: { src: url.trim(), align: "center" },
      })
      .run();
  }

  async function onImageFileSelected(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editor) return;

    setUploadingImage(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", imageFolder);
      const response = await adminUpload<{ url: string }>(
        "/api/admin/upload",
        formData
      );
      editor
        .chain()
        .focus()
        .insertContent({
          type: "image",
          attrs: { src: response.url, align: "center" },
        })
        .run();
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Échec de l'upload"
      );
    } finally {
      setUploadingImage(false);
    }
  }

  function insertTable() {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }

  function setImageAlign(align: ImageAlign) {
    if (!editor?.isActive("image")) return;
    editor.chain().focus().updateAttributes("image", { align }).run();
  }

  function setImageWidthRatio(ratio: number) {
    if (!editor?.isActive("image")) return;
    const contentWidth = Math.max(160, editor.view.dom.clientWidth - 32);
    const width = Math.round(contentWidth * ratio);
    const current = editor.getAttributes("image");
    const height =
      current.width && current.height
        ? Math.round(width * (Number(current.height) / Number(current.width)))
        : null;
    editor
      .chain()
      .focus()
      .updateAttributes("image", { width, height })
      .run();
  }

  function setTextAlign(alignment: TextAlignment) {
    if (!editor) return;
    const type = editor.isActive("heading") ? "heading" : "paragraph";
    editor.chain().focus().updateAttributes(type, { textAlign: alignment }).run();
  }

  const inTable = editor.isActive("table");
  const inImage = editor.isActive("image");
  const imageAlign = (editor.getAttributes("image").align as ImageAlign) || "center";

  return (
    <div className="overflow-hidden rounded-xl border border-input bg-card focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-secondary/40 px-1.5 py-1.5">
        <ToolbarButton
          label="Annuler"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Rétablir"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo2 className="size-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          label="Gras"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italique"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Souligné"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Barré"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Surligné"
          active={editor.isActive("highlight")}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          <Highlighter className="size-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          label="Titre 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Titre 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="size-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          label="Aligner à gauche"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => setTextAlign("left")}
        >
          <AlignLeft className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Centrer"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => setTextAlign("center")}
        >
          <AlignCenter className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Aligner à droite"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => setTextAlign("right")}
        >
          <AlignRight className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Justifier"
          active={editor.isActive({ textAlign: "justify" })}
          onClick={() => setTextAlign("justify")}
        >
          <AlignJustify className="size-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          label="Liste à puces"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Liste numérotée"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Citation"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          label="Lien"
          active={editor.isActive("link")}
          onClick={setLink}
        >
          <Link2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Retirer le lien"
          disabled={!editor.isActive("link")}
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <Unlink className="size-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={(event) => void onImageFileSelected(event)}
        />
        <ToolbarButton
          label="Uploader une image"
          disabled={uploadingImage}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploadingImage ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImagePlus className="size-4" />
          )}
        </ToolbarButton>
        <ToolbarButton
          label="Image par URL"
          disabled={uploadingImage}
          onClick={insertImageByUrl}
        >
          <ImageIcon className="size-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          label="Insérer un tableau"
          active={inTable}
          onClick={insertTable}
        >
          <Table className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Ajouter une colonne"
          disabled={!inTable}
          onClick={() => editor.chain().focus().addColumnAfter().run()}
        >
          <Columns2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Ajouter une ligne"
          disabled={!inTable}
          onClick={() => editor.chain().focus().addRowAfter().run()}
        >
          <Rows2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="En-tête de tableau"
          disabled={!inTable}
          active={editor.isActive("tableHeader")}
          onClick={() => editor.chain().focus().toggleHeaderRow().run()}
        >
          <TableCellsMerge className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Supprimer le tableau"
          disabled={!inTable}
          onClick={() => editor.chain().focus().deleteTable().run()}
        >
          <Trash2 className="size-4" />
        </ToolbarButton>
      </div>

      {inImage ? (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-accent/40 px-1.5 py-1.5">
          <ToolbarLabel>Image</ToolbarLabel>
          <ToolbarButton
            label="Aligner à gauche"
            active={imageAlign === "left"}
            onClick={() => setImageAlign("left")}
          >
            <AlignLeft className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Centrer"
            active={imageAlign === "center"}
            onClick={() => setImageAlign("center")}
          >
            <AlignCenter className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Aligner à droite"
            active={imageAlign === "right"}
            onClick={() => setImageAlign("right")}
          >
            <AlignRight className="size-4" />
          </ToolbarButton>

          <span className="mx-1 h-5 w-px bg-border" />

          <ToolbarLabel>Taille</ToolbarLabel>
          <ToolbarButton label="25 %" onClick={() => setImageWidthRatio(0.25)}>
            <span className="text-[10px] font-bold">S</span>
          </ToolbarButton>
          <ToolbarButton label="50 %" onClick={() => setImageWidthRatio(0.5)}>
            <span className="text-[10px] font-bold">M</span>
          </ToolbarButton>
          <ToolbarButton label="75 %" onClick={() => setImageWidthRatio(0.75)}>
            <span className="text-[10px] font-bold">L</span>
          </ToolbarButton>
          <ToolbarButton label="100 %" onClick={() => setImageWidthRatio(1)}>
            <span className="text-[10px] font-bold">XL</span>
          </ToolbarButton>

          <span className="mx-1 h-5 w-px bg-border" />

          <ToolbarButton
            label="Supprimer l’image"
            onClick={() => editor.chain().focus().deleteSelection().run()}
          >
            <Trash2 className="size-4" />
          </ToolbarButton>

          <p className="ml-2 text-[11px] text-muted-foreground">
            Clique l’image pour afficher les poignées, puis tire un coin pour
            redimensionner
          </p>
        </div>
      ) : null}

      {uploadError ? (
        <p className="border-b border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {uploadError}
        </p>
      ) : null}

      <EditorContent editor={editor} />
    </div>
  );
}

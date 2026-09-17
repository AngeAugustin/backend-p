import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ResizableImageView } from "@/components/admin/ResizableImageView";

export type ImageAlign = "left" | "center" | "right";

/**
 * TipTap Image with click-to-select resize handles + alignment.
 */
export const ResizableImage = Image.extend({
  name: "image",

  addOptions() {
    return {
      ...this.parent?.(),
      inline: false,
      allowBase64: false,
      // Custom React node view handles resize UI.
      resize: false as const,
      HTMLAttributes: {
        class: "rounded-xl border border-border max-w-full h-auto",
      },
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: "center" satisfies ImageAlign,
        parseHTML: (element) => {
          const value = element.getAttribute("data-align");
          if (value === "left" || value === "center" || value === "right") {
            return value;
          }
          return "center";
        },
        renderHTML: (attributes) => {
          const align = (attributes.align as ImageAlign) || "center";
          return { "data-align": align };
        },
      },
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute("width") || element.style.width;
          if (!width) return null;
          const parsed = Number.parseInt(String(width), 10);
          return Number.isFinite(parsed) ? parsed : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return {
            width: attributes.width,
            style: `width: ${attributes.width}px; height: auto;`,
          };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => {
          const height = element.getAttribute("height");
          if (!height) return null;
          const parsed = Number.parseInt(String(height), 10);
          return Number.isFinite(parsed) ? parsed : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.height) return {};
          return { "data-height": String(attributes.height) };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView, {
      className: "resizable-image-react-node",
    });
  },
});

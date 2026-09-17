import { Extension } from "@tiptap/core";

export type TextAlignment = "left" | "center" | "right" | "justify";

/**
 * Adds `textAlign` support on paragraphs and headings.
 * Alignment is applied via `updateAttributes('paragraph'|'heading', { textAlign })`.
 */
export const ArticleTextAlign = Extension.create({
  name: "articleTextAlign",

  addOptions() {
    return {
      types: ["heading", "paragraph"],
      defaultAlignment: null as TextAlignment | null,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textAlign: {
            default: this.options.defaultAlignment,
            parseHTML: (element) => {
              const value = element.style.textAlign;
              if (
                value === "left" ||
                value === "center" ||
                value === "right" ||
                value === "justify"
              ) {
                return value;
              }
              return this.options.defaultAlignment;
            },
            renderHTML: (attributes) => {
              if (!attributes.textAlign) return {};
              return { style: `text-align: ${attributes.textAlign}` };
            },
          },
        },
      },
    ];
  },
});

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { FaqNodeView } from "@/components/admin/FaqNodeView";

function readFaqText(element: HTMLElement, role: "question" | "answer") {
  const node = element.querySelector(`[data-faq='${role}']`);
  if (!node) return "";
  // Prefer text; keep paragraph breaks when answer was saved as HTML <p>…</p>
  if (role === "answer") {
    const paragraphs = Array.from(node.querySelectorAll("p"))
      .map((p) => p.textContent?.trim() || "")
      .filter(Boolean);
    if (paragraphs.length > 0) return paragraphs.join("\n\n");
  }
  return (node.textContent || "").trim();
}

export const FaqItem = Node.create({
  name: "faqItem",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      question: {
        default: "",
        parseHTML: (element) => readFaqText(element as HTMLElement, "question"),
      },
      answer: {
        default: "",
        parseHTML: (element) => readFaqText(element as HTMLElement, "answer"),
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'details[data-type="faq"]' },
      { tag: 'div[data-type="faq"]' },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const question = String(node.attrs.question || "Question");
    const answer = String(node.attrs.answer || "");

    return [
      "details",
      mergeAttributes(HTMLAttributes, {
        "data-type": "faq",
        class: "article-faq",
      }),
      [
        "summary",
        { "data-faq": "question", class: "article-faq-question" },
        question,
      ],
      [
        "div",
        { "data-faq": "answer", class: "article-faq-answer" },
        answer,
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FaqNodeView);
  },
});

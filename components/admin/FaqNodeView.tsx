"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { CircleHelp, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FaqNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const question = String(node.attrs.question ?? "");
  const answer = String(node.attrs.answer ?? "");

  return (
    <NodeViewWrapper
      as="div"
      className={cn(
        "faq-node my-3 rounded-xl border border-border bg-secondary/40 p-3",
        selected && "ring-2 ring-glow/40"
      )}
      data-type="faq"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-glow">
          <CircleHelp className="size-3.5" />
          FAQ
        </p>
        <button
          type="button"
          title="Supprimer cette FAQ"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => deleteNode()}
          className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          Question
        </span>
        <input
          type="text"
          value={question}
          placeholder="Ex. Combien de temps dure un projet ?"
          onMouseDown={(event) => event.stopPropagation()}
          onChange={(event) =>
            updateAttributes({ question: event.target.value })
          }
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </label>

      <label className="mt-3 block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          Réponse
        </span>
        <textarea
          value={answer}
          rows={4}
          placeholder="Rédige la réponse…"
          onMouseDown={(event) => event.stopPropagation()}
          onChange={(event) => updateAttributes({ answer: event.target.value })}
          className="w-full resize-y rounded-lg border border-input bg-card px-3 py-2 text-sm leading-relaxed text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </label>
    </NodeViewWrapper>
  );
}

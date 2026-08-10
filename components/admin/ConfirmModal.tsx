"use client";

import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) onCancel();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
        onClick={() => {
          if (!loading) onCancel();
        }}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-6"
      >
        <button
          type="button"
          onClick={() => {
            if (!loading) onCancel();
          }}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <div className="flex gap-4">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl",
              tone === "danger"
                ? "bg-destructive/10 text-destructive"
                : "bg-accent text-accent-foreground"
            )}
          >
            <AlertTriangle className="size-5" />
          </div>
          <div className="min-w-0 pt-0.5">
            <h3
              id="confirm-modal-title"
              className="font-display text-lg font-semibold tracking-tight text-foreground"
            >
              {title}
            </h3>
            <p
              id="confirm-modal-description"
              className="mt-1.5 text-sm leading-relaxed text-muted-foreground"
            >
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="inline-flex h-10 items-center rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:bg-accent disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={cn(
              "inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-white transition disabled:opacity-60",
              tone === "danger"
                ? "bg-destructive hover:bg-destructive/90"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {loading ? "Patientez…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

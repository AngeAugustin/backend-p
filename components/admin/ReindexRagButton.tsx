"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

type ReindexResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
  details?: string;
  result?: {
    indexed: number;
    databaseFiles: number;
    markdownFiles: number;
    counts: {
      projects: number;
      experiences: number;
      educations: number;
      services: number;
      articles: number;
    };
  };
};

export function ReindexRagButton() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "ok" | "error";
    text: string;
  } | null>(null);

  async function runReindex() {
    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/rag/reindex", {
        method: "POST",
      });
      const data = (await response.json()) as ReindexResponse;

      if (!response.ok) {
        throw new Error(data.details || data.error || "Reindex failed");
      }

      const counts = data.result?.counts;
      const summary = counts
        ? `${data.result?.indexed ?? 0} chunks indexés (${counts.projects} projets, ${counts.experiences} expériences, ${counts.educations} formations, ${counts.services} services, ${counts.articles} articles).`
        : data.message || "Index reconstruit.";

      setFeedback({ tone: "ok", text: summary });
      setConfirmOpen(false);
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Reindex failed",
      });
      setConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[14px] border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_rgba(15,23,42,0.06)]">
      <ConfirmModal
        open={confirmOpen}
        title="Réindexer le chat ?"
        description="Le chat va relire la base (projets, expériences, formations, services, articles) + les fichiers skills/about, puis reconstruire l’index Supabase. Cela peut prendre 1–3 minutes."
        confirmLabel="Réindexer"
        cancelLabel="Annuler"
        tone="default"
        loading={loading}
        onConfirm={() => void runReindex()}
        onCancel={() => !loading && setConfirmOpen(false)}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold text-foreground">
            Chat Kadoukpè (RAG)
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Après avoir créé ou modifié des contenus en prod, réindexez pour que
            le chat voit les nouvelles infos.
          </p>
          {feedback ? (
            <p
              className={
                feedback.tone === "ok"
                  ? "mt-3 text-sm font-medium text-emerald-700"
                  : "mt-3 text-sm font-medium text-destructive"
              }
            >
              {feedback.text}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => setConfirmOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-95 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          {loading ? "Indexation…" : "Réindexer le chat"}
        </button>
      </div>
    </div>
  );
}

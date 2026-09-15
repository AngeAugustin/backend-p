"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Clock3,
  MessageSquareText,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-client";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { cn } from "@/lib/utils";

type CommentStatus = "pending" | "approved" | "rejected";

type ArticleRef = {
  id: string;
  title: string;
  slug: string;
  locale: string;
};

type Comment = {
  id: string;
  authorName: string;
  authorEmail: string | null;
  body: string;
  status: CommentStatus;
  articleId: string;
  article: ArticleRef;
  createdAt: string;
};

type Folder = "all" | CommentStatus;

const FOLDERS: { key: Folder; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "pending", label: "En attente" },
  { key: "approved", label: "Approuvés" },
  { key: "rejected", label: "Rejetés" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function preview(text: string, max = 100) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

export default function ArticleCommentsPage() {
  const [rows, setRows] = useState<Comment[]>([]);
  const [folder, setFolder] = useState<Folder>("pending");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Comment | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      const response = await adminFetch<{ data: Comment[] }>(
        "/api/admin/article-comments"
      );
      setRows(response.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const counts = useMemo(
    () => ({
      all: rows.length,
      pending: rows.filter((row) => row.status === "pending").length,
      approved: rows.filter((row) => row.status === "approved").length,
      rejected: rows.filter((row) => row.status === "rejected").length,
    }),
    [rows]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((row) => (folder === "all" ? true : row.status === folder))
      .filter((row) => {
        if (!q) return true;
        return (
          row.authorName.toLowerCase().includes(q) ||
          (row.authorEmail || "").toLowerCase().includes(q) ||
          row.body.toLowerCase().includes(q) ||
          row.article.title.toLowerCase().includes(q) ||
          row.article.slug.toLowerCase().includes(q)
        );
      });
  }, [rows, folder, query]);

  async function setStatus(id: string, status: CommentStatus) {
    setBusyId(id);
    try {
      await adminFetch(`/api/admin/article-comments/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      setRows((current) =>
        current.map((row) => (row.id === id ? { ...row, status } : row))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise à jour impossible");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminFetch(`/api/admin/article-comments/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const deletedId = deleteTarget.id;
      setDeleteTarget(null);
      setRows((current) => current.filter((row) => row.id !== deletedId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Supprimer ce commentaire ?"
        description={
          deleteTarget
            ? `Le commentaire de ${deleteTarget.authorName} sera définitivement supprimé.`
            : "Ce commentaire sera définitivement supprimé."
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        tone="danger"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      />

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Commentaires
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Modérez les commentaires laissés sur vos articles.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FOLDERS.map((item) => {
            const active = folder === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFolder(item.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
                <span className="tabular-nums opacity-80">{counts[item.key]}</span>
              </button>
            );
          })}
        </div>

        <label className="relative block w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher…"
            className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
          Chargement…
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <MessageSquareText className="mx-auto size-8 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            Aucun commentaire dans ce filtre.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((comment) => {
            const busy = busyId === comment.id;
            return (
              <li
                key={comment.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">
                        {comment.authorName}
                      </p>
                      {comment.authorEmail ? (
                        <span className="text-xs text-muted-foreground">
                          {comment.authorEmail}
                        </span>
                      ) : null}
                      <StatusBadge status={comment.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {comment.article.title} · {comment.article.locale.toUpperCase()} ·{" "}
                      {formatDate(comment.createdAt)}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                      {preview(comment.body, 400)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {comment.status !== "approved" ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void setStatus(comment.id, "approved")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Check className="size-3.5" />
                        Approuver
                      </button>
                    ) : null}
                    {comment.status !== "rejected" ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void setStatus(comment.id, "rejected")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-secondary/80 disabled:opacity-50"
                      >
                        <X className="size-3.5" />
                        Rejeter
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setDeleteTarget(comment)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/15 disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" />
                      Supprimer
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: CommentStatus }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
        <Check className="size-3" />
        Approuvé
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-destructive">
        <X className="size-3" />
        Rejeté
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
      <Clock3 className="size-3" />
      En attente
    </span>
  );
}

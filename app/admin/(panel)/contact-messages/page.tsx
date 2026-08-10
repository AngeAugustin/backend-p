"use client";

import { useEffect, useState } from "react";
import { Archive, Check, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-client";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { PageHeader } from "@/components/admin/PageHeader";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  name: string;
  email: string;
  message: string;
  locale: string;
  status: string;
  createdAt: string;
};

export default function ContactMessagesPage() {
  const [rows, setRows] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      const response = await adminFetch<{ data: Message[] }>(
        "/api/admin/contact-messages"
      );
      setRows(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function setStatus(id: string, status: string) {
    await adminFetch(`/api/admin/contact-messages/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminFetch(`/api/admin/contact-messages/${deleteTarget.id}`, {
        method: "DELETE",
      });
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Supprimer ce message ?"
        description={
          deleteTarget
            ? `Le message de ${deleteTarget.name} (${deleteTarget.email}) sera définitivement supprimé.`
            : "Ce message sera définitivement supprimé."
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

      <PageHeader
        title="Messages"
        description="Messages reçus via le formulaire de contact du site."
      />

      {error ? (
        <p className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        {rows.map((row) => (
          <article
            key={row.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold tracking-tight">
                  {row.name}{" "}
                  <span className="font-sans text-sm font-normal text-muted-foreground">
                    &lt;{row.email}&gt;
                  </span>
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(row.createdAt).toLocaleString()} · {row.locale} ·{" "}
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-medium",
                      row.status === "new"
                        ? "bg-glow/10 text-glow"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {row.status}
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void setStatus(row.id, "read")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm transition hover:bg-accent"
                >
                  <Check className="size-3.5" />
                  Lu
                </button>
                <button
                  type="button"
                  onClick={() => void setStatus(row.id, "archived")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm transition hover:bg-accent"
                >
                  <Archive className="size-3.5" />
                  Archiver
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(row)}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-destructive transition hover:bg-destructive/5"
                >
                  <Trash2 className="size-3.5" />
                  Supprimer
                </button>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {row.message}
            </p>
          </article>
        ))}
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card/50 px-5 py-10 text-center text-sm text-muted-foreground">
            Aucun message.
          </p>
        ) : null}
      </div>
    </div>
  );
}

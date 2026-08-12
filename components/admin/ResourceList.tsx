"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-client";
import type { ResourceConfig } from "@/lib/admin-resources";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { DuplicateResourceButton } from "@/components/admin/DuplicateResourceButton";
import { PageHeader } from "@/components/admin/PageHeader";
import { cn } from "@/lib/utils";

type Row = Record<string, unknown> & { id: string; publishedAt?: string | null };

export function ResourceList({ resource }: { resource: ResourceConfig }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [locale, setLocale] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const query = locale === "all" ? "" : `?locale=${locale}`;
      const response = await adminFetch<{ data: Row[] }>(
        `${resource.apiPath}${query}`
      );
      setRows(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [locale, resource.apiPath]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminFetch(`${resource.apiPath}/${deleteTarget.id}`, {
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

  const deleteTitle = deleteTarget
    ? String(deleteTarget[resource.titleField] ?? resource.singular)
    : "";

  return (
    <div>
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={`Supprimer ${resource.singular.toLowerCase()} ?`}
        description={
          deleteTitle
            ? `« ${deleteTitle} » sera définitivement supprimé. Cette action est irréversible.`
            : `Cet élément sera définitivement supprimé. Cette action est irréversible.`
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
        title={resource.label}
        description={`Gérer les contenus ${resource.label.toLowerCase()} (FR / EN).`}
        actions={
          <>
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              Locale
              <select
                value={locale}
                onChange={(event) => setLocale(event.target.value)}
                className="h-10 rounded-xl border border-input bg-card px-3 text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              >
                <option value="all">Toutes</option>
                <option value="fr">fr</option>
                <option value="en">en</option>
              </select>
            </label>
            <Link
              href={`/admin/${resource.key}/new`}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              <Plus className="size-4" />
              Nouveau
            </Link>
          </>
        }
      />

      {error ? (
        <p className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-secondary/70 text-muted-foreground">
            <tr>
              <th className="px-5 py-3.5 font-medium">Titre</th>
              <th className="px-5 py-3.5 font-medium">Locale</th>
              <th className="px-5 py-3.5 font-medium">Statut</th>
              <th className="px-5 py-3.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-5 py-8 text-muted-foreground" colSpan={4}>
                  Chargement…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-muted-foreground" colSpan={4}>
                  Aucun élément.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-border/70 transition hover:bg-accent/40"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/${resource.key}/${row.id}`}
                      className="group block"
                    >
                      <div className="font-medium text-foreground group-hover:text-glow">
                        {String(row[resource.titleField] ?? "—")}
                      </div>
                      {resource.subtitleField ? (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {String(row[resource.subtitleField] ?? "")}
                        </div>
                      ) : null}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {String(row.locale ?? "")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        row.publishedAt
                          ? "bg-glow/10 text-glow"
                          : "bg-amber-50 text-amber-700"
                      )}
                    >
                      {row.publishedAt ? "Publié" : "Brouillon"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/${resource.key}/${row.id}`}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-foreground transition hover:bg-accent"
                      >
                        <Eye className="size-3.5" />
                        Voir
                      </Link>
                      <Link
                        href={`/admin/${resource.key}/${row.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-foreground transition hover:bg-accent"
                      >
                        <Pencil className="size-3.5" />
                        Éditer
                      </Link>
                      {resource.duplicable ? (
                        <DuplicateResourceButton
                          resource={resource}
                          id={row.id}
                          compact
                        />
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-destructive transition hover:bg-destructive/5"
                      >
                        <Trash2 className="size-3.5" />
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

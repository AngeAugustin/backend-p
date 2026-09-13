"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-client";
import {
  formatDate,
  formatMoney,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUSES,
  isInvoiceFinalized,
  type InvoiceStatus,
  type SerializedInvoice,
} from "@/lib/invoice-shared";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { InvoiceDownloadButton } from "@/components/admin/InvoiceDownloadButton";
import { InvoiceStatusBadge } from "@/components/admin/InvoiceStatusBadge";
import { PageHeader } from "@/components/admin/PageHeader";

export function InvoiceList() {
  const [rows, setRows] = useState<SerializedInvoice[]>([]);
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<SerializedInvoice | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const search = status === "all" ? "" : `?status=${status}`;
      const response = await adminFetch<{ data: SerializedInvoice[] }>(
        `/api/admin/invoices${search}`
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
  }, [status]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      [row.number, row.clientName, row.clientCompany, row.clientEmail]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [rows, query]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminFetch(`/api/admin/invoices/${deleteTarget.id}`, {
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
        title="Supprimer cette proforma ?"
        description={
          deleteTarget
            ? `La facture ${deleteTarget.number} (${deleteTarget.clientName}) sera définitivement supprimée.`
            : "Cette facture sera définitivement supprimée."
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
        title="Factures PROFORMA"
        description="Brouillon tant que vous éditez, puis finalisée pour le téléchargement."
        actions={
          <>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un client ou un n°"
              className="h-10 w-56 rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              Statut
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-10 rounded-xl border border-input bg-card px-3 text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              >
                <option value="all">Tous</option>
                {INVOICE_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {INVOICE_STATUS_LABELS[value as InvoiceStatus]}
                  </option>
                ))}
              </select>
            </label>
            <Link
              href="/admin/invoices/new"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              <Plus className="size-4" />
              Nouvelle proforma
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
              <th className="px-5 py-3.5 font-medium">N°</th>
              <th className="px-5 py-3.5 font-medium">Client</th>
              <th className="px-5 py-3.5 font-medium">Date</th>
              <th className="px-5 py-3.5 font-medium">Montant</th>
              <th className="px-5 py-3.5 font-medium">Statut</th>
              <th className="px-5 py-3.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-5 py-8 text-muted-foreground" colSpan={6}>
                  Chargement…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-muted-foreground" colSpan={6}>
                  Aucune facture proforma.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-border/70 transition hover:bg-accent/40"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/invoices/${row.id}`}
                      className="font-medium text-foreground hover:text-glow"
                    >
                      {row.number}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium">{row.clientName}</div>
                    {row.clientCompany ? (
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {row.clientCompany}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {formatDate(row.issuedAt)}
                  </td>
                  <td className="px-5 py-4 font-medium">
                    {formatMoney(row.total, row.currency)}
                  </td>
                  <td className="px-5 py-4">
                    <InvoiceStatusBadge status={row.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-1">
                      <Link
                        href={`/admin/invoices/${row.id}`}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-foreground transition hover:bg-accent"
                      >
                        <Eye className="size-3.5" />
                        Voir
                      </Link>
                      {isInvoiceFinalized(row.status) ? null : (
                        <Link
                          href={`/admin/invoices/${row.id}/edit`}
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-foreground transition hover:bg-accent"
                        >
                          <Pencil className="size-3.5" />
                          Éditer
                        </Link>
                      )}
                      <InvoiceDownloadButton
                        id={row.id}
                        number={row.number}
                        compact
                      />
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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-client";
import {
  isInvoiceFinalized,
  type SerializedInvoice,
} from "@/lib/invoice-shared";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { InvoiceDownloadButton } from "@/components/admin/InvoiceDownloadButton";
import { InvoicePreview } from "@/components/admin/InvoicePreview";
import { PageHeader } from "@/components/admin/PageHeader";

export function InvoiceDetail({ id }: { id: string }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<SerializedInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopening, setReopening] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await adminFetch<{ data: SerializedInvoice }>(
          `/api/admin/invoices/${id}`
        );
        if (!cancelled) setInvoice(response.data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Facture introuvable");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function confirmDelete() {
    setDeleting(true);
    try {
      await adminFetch(`/api/admin/invoices/${id}`, { method: "DELETE" });
      router.push("/admin/invoices");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible");
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  async function confirmFinalize() {
    setFinalizing(true);
    try {
      const response = await adminFetch<{ data: SerializedInvoice }>(
        `/api/admin/invoices/${id}/finalize`,
        { method: "POST" }
      );
      setInvoice(response.data);
      setFinalizeOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Finalisation impossible");
      setFinalizeOpen(false);
    } finally {
      setFinalizing(false);
    }
  }

  async function confirmReopen() {
    setReopening(true);
    try {
      const response = await adminFetch<{ data: SerializedInvoice }>(
        `/api/admin/invoices/${id}/reopen`,
        { method: "POST" }
      );
      setInvoice(response.data);
      setReopenOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Réouverture impossible");
      setReopenOpen(false);
    } finally {
      setReopening(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Chargement…</p>;
  }

  if (!invoice) {
    return (
      <div>
        <p className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error || "Facture introuvable"}
        </p>
        <Link
          href="/admin/invoices"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium transition hover:bg-accent"
        >
          <ArrowLeft className="size-4" />
          Retour aux factures
        </Link>
      </div>
    );
  }

  const locked = isInvoiceFinalized(invoice.status);

  return (
    <div>
      <ConfirmModal
        open={deleteOpen}
        title="Supprimer cette proforma ?"
        description={`La facture ${invoice.number} sera définitivement supprimée.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        tone="danger"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!deleting) setDeleteOpen(false);
        }}
      />
      <ConfirmModal
        open={finalizeOpen}
        title="Finaliser cette proforma ?"
        description="Une fois finalisée, elle ne pourra plus être modifiée tant qu’elle n’est pas réouverte. Vous pourrez toujours la télécharger."
        confirmLabel="Finaliser"
        cancelLabel="Annuler"
        tone="default"
        loading={finalizing}
        onConfirm={() => void confirmFinalize()}
        onCancel={() => {
          if (!finalizing) setFinalizeOpen(false);
        }}
      />
      <ConfirmModal
        open={reopenOpen}
        title="Réouvrir cette proforma ?"
        description="Elle repassera en brouillon et pourra être modifiée. Vous pourrez la finaliser à nouveau ensuite."
        confirmLabel="Réouvrir"
        cancelLabel="Annuler"
        tone="default"
        loading={reopening}
        onConfirm={() => void confirmReopen()}
        onCancel={() => {
          if (!reopening) setReopenOpen(false);
        }}
      />

      <PageHeader
        title={invoice.number}
        description={
          locked
            ? `Proforma finalisée · ${invoice.clientName}`
            : `Proforma brouillon · ${invoice.clientName}`
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/invoices"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium transition hover:bg-accent"
            >
              <ArrowLeft className="size-4" />
              Retour
            </Link>
            <InvoiceDownloadButton id={invoice.id} number={invoice.number} />
            {locked ? (
              <button
                type="button"
                onClick={() => setReopenOpen(true)}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                <RotateCcw className="size-4" />
                Réouvrir
              </button>
            ) : (
              <>
                <Link
                  href={`/admin/invoices/${invoice.id}/edit`}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium transition hover:bg-accent"
                >
                  <Pencil className="size-4" />
                  Éditer
                </Link>
                <button
                  type="button"
                  onClick={() => setFinalizeOpen(true)}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  <Check className="size-4" />
                  Finaliser
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium text-destructive transition hover:bg-destructive/5"
            >
              <Trash2 className="size-4" />
              Supprimer
            </button>
          </div>
        }
      />

      {error ? (
        <p className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <InvoicePreview invoice={invoice} />
    </div>
  );
}

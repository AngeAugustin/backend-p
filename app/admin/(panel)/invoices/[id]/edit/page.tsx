"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminFetch } from "@/lib/admin-client";
import { InvoiceForm } from "@/components/admin/InvoiceForm";
import { isInvoiceFinalized, type SerializedInvoice } from "@/lib/invoice-shared";
import Link from "next/link";

export default function EditInvoicePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [invoice, setInvoice] = useState<SerializedInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await adminFetch<{ data: SerializedInvoice }>(
          `/api/admin/invoices/${id}`
        );
        if (!cancelled) setInvoice(response.data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Facture introuvable");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (!invoice) {
    return <p className="text-sm text-muted-foreground">Chargement…</p>;
  }

  if (isInvoiceFinalized(invoice.status)) {
    return (
      <div>
        <p className="mb-4 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Cette proforma est finalisée. Réouvrez-la depuis la fiche pour pouvoir
          la modifier.
        </p>
        <Link
          href={`/admin/invoices/${id}`}
          className="inline-flex h-11 items-center rounded-full border border-border bg-card px-5 text-sm font-medium transition hover:bg-accent"
        >
          Voir le document
        </Link>
      </div>
    );
  }

  return <InvoiceForm id={id} initial={invoice} />;
}

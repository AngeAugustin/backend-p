"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-client";
import { defaultIssuer } from "@/lib/invoice-issuer";
import {
  computeTotals,
  defaultValidUntilInput,
  formatMoney,
  isInvoiceFinalized,
  toDateInput,
  type InvoiceStatus,
  type SerializedInvoice,
} from "@/lib/invoice-shared";
import { PageHeader } from "@/components/admin/PageHeader";

const fieldClass =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30";

type LineItem = {
  key: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
};

type FormState = {
  status: InvoiceStatus;
  issuedAt: string;
  validUntil: string;
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  clientPhone: string;
  clientAddress: string;
  clientCity: string;
  clientCountry: string;
  clientIfu: string;
  issuerName: string;
  issuerTitle: string;
  issuerEmail: string;
  issuerPhone: string;
  issuerAddress: string;
  issuerCity: string;
  issuerCountry: string;
  issuerIfu: string;
  issuerWebsite: string;
  currency: "XOF" | "EUR";
  taxRate: number;
  notes: string;
  items: LineItem[];
};

function todayInput() {
  return toDateInput(new Date());
}

let lineCounter = 0;

function newItem(): LineItem {
  lineCounter += 1;
  return {
    key: `line-${lineCounter}`,
    description: "",
    quantity: 1,
    unit: "u",
    unitPrice: 0,
  };
}

function defaultsFromInvoice(
  initial?: SerializedInvoice,
  defaultIssuedAt?: string,
  defaultValidUntil?: string
): FormState {
  if (!initial) {
    return {
      status: "draft",
      issuedAt: defaultIssuedAt || todayInput(),
      validUntil: defaultValidUntil || defaultValidUntilInput(),
      clientName: "",
      clientEmail: "",
      clientCompany: "",
      clientPhone: "",
      clientAddress: "",
      clientCity: "",
      clientCountry: "Bénin",
      clientIfu: "",
      issuerName: defaultIssuer.name,
      issuerTitle: defaultIssuer.title,
      issuerEmail: defaultIssuer.email,
      issuerPhone: defaultIssuer.phone,
      issuerAddress: defaultIssuer.address,
      issuerCity: defaultIssuer.city,
      issuerCountry: defaultIssuer.country,
      issuerIfu: defaultIssuer.ifu,
      issuerWebsite: defaultIssuer.website,
      currency: "XOF",
      taxRate: 0,
      notes: "",
      items: [newItem()],
    };
  }

  return {
    status: initial.status,
    issuedAt: toDateInput(initial.issuedAt),
    validUntil: toDateInput(initial.validUntil),
    clientName: initial.clientName || "",
    clientEmail: initial.clientEmail || "",
    clientCompany: initial.clientCompany || "",
    clientPhone: initial.clientPhone || "",
    clientAddress: initial.clientAddress || "",
    clientCity: initial.clientCity || "",
    clientCountry: initial.clientCountry || "",
    clientIfu: initial.clientIfu || "",
    issuerName: initial.issuerName || defaultIssuer.name,
    issuerTitle: initial.issuerTitle || "",
    issuerEmail: initial.issuerEmail || defaultIssuer.email,
    issuerPhone: initial.issuerPhone || "",
    issuerAddress: initial.issuerAddress || "",
    issuerCity: initial.issuerCity || "",
    issuerCountry: initial.issuerCountry || "",
    issuerIfu: initial.issuerIfu || "",
    issuerWebsite: initial.issuerWebsite || "",
    currency: initial.currency === "EUR" ? "EUR" : "XOF",
    taxRate: initial.taxRate,
    notes: initial.notes || "",
    items:
      initial.items.length > 0
        ? initial.items.map((item) => ({
            key: item.id || `item-${item.order}`,
            description: item.description,
            quantity: 1,
            unit: "u",
            unitPrice: item.amount,
          }))
        : [newItem()],
  };
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className || "block text-sm"}>
      <span className="mb-1.5 block font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 font-display text-base font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function InvoiceForm({
  initial,
  id,
  defaultIssuedAt,
  defaultValidUntil,
}: {
  initial?: SerializedInvoice;
  id?: string;
  defaultIssuedAt?: string;
  defaultValidUntil?: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormState>(() =>
    defaultsFromInvoice(initial, defaultIssuedAt, defaultValidUntil)
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const totals = useMemo(
    () => computeTotals(values.items, values.taxRate),
    [values.items, values.taxRate]
  );

  function update<K extends keyof FormState>(name: K, value: FormState[K]) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function updateItem(key: string, patch: Partial<LineItem>) {
    setValues((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.key === key ? { ...item, ...patch } : item
      ),
    }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...values,
      status: "draft" as const,
      items: values.items.map(({ key: _key, description, unitPrice }) => ({
        description,
        quantity: 1,
        unit: "u",
        unitPrice,
      })),
    };

    try {
      if (id) {
        await adminFetch(`/api/admin/invoices/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        router.push(`/admin/invoices/${id}`);
      } else {
        const created = await adminFetch<{ data: { id: string } }>(
          "/api/admin/invoices",
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
        router.push(`/admin/invoices/${created.data.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  if (initial && isInvoiceFinalized(initial.status)) {
    return (
      <div>
        <p className="mb-4 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Cette proforma est finalisée et ne peut plus être modifiée. Vous pouvez
          uniquement la télécharger.
        </p>
        <Link
          href={`/admin/invoices/${id}`}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium transition hover:bg-accent"
        >
          Voir le document
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <PageHeader
        title={id ? `Éditer ${initial?.number || "la proforma"}` : "Nouvelle facture PROFORMA"}
        description="Enregistrée en brouillon. Une fois finalisée depuis la fiche, elle ne pourra plus être modifiée."
        actions={
          id ? (
            <Link
              href={`/admin/invoices/${id}`}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium transition hover:bg-accent"
            >
              <ArrowLeft className="size-4" />
              Voir le détail
            </Link>
          ) : (
            <Link
              href="/admin/invoices"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium transition hover:bg-accent"
            >
              <ArrowLeft className="size-4" />
              Retour
            </Link>
          )
        }
      />

      {error ? (
        <p className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <Section title="Client">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nom / raison sociale">
                <input
                  required
                  className={fieldClass}
                  value={values.clientName}
                  onChange={(event) => update("clientName", event.target.value)}
                />
              </Field>
              <Field label="Société (si différent)">
                <input
                  className={fieldClass}
                  value={values.clientCompany}
                  onChange={(event) => update("clientCompany", event.target.value)}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  className={fieldClass}
                  value={values.clientEmail}
                  onChange={(event) => update("clientEmail", event.target.value)}
                />
              </Field>
              <Field label="Téléphone">
                <input
                  className={fieldClass}
                  value={values.clientPhone}
                  onChange={(event) => update("clientPhone", event.target.value)}
                />
              </Field>
              <Field label="Adresse" className="block text-sm md:col-span-2">
                <textarea
                  rows={2}
                  className={fieldClass}
                  value={values.clientAddress}
                  onChange={(event) => update("clientAddress", event.target.value)}
                />
              </Field>
              <Field label="Ville">
                <input
                  className={fieldClass}
                  value={values.clientCity}
                  onChange={(event) => update("clientCity", event.target.value)}
                />
              </Field>
              <Field label="Pays">
                <input
                  className={fieldClass}
                  value={values.clientCountry}
                  onChange={(event) => update("clientCountry", event.target.value)}
                />
              </Field>
              <Field label="IFU / N° fiscal (optionnel)">
                <input
                  className={fieldClass}
                  value={values.clientIfu}
                  onChange={(event) => update("clientIfu", event.target.value)}
                />
              </Field>
            </div>
          </Section>

          <Section title="Document">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Date d’émission">
                <input
                  type="date"
                  required
                  className={fieldClass}
                  value={values.issuedAt}
                  onChange={(event) => update("issuedAt", event.target.value)}
                />
              </Field>
              <Field label="Valable jusqu’au">
                <input
                  type="date"
                  className={fieldClass}
                  value={values.validUntil}
                  onChange={(event) => update("validUntil", event.target.value)}
                />
              </Field>
              <Field label="Devise">
                <select
                  className={fieldClass}
                  value={values.currency}
                  onChange={(event) =>
                    update("currency", event.target.value as "XOF" | "EUR")
                  }
                >
                  <option value="XOF">F CFA (XOF)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </Field>
              <Field label="TVA">
                <select
                  className={fieldClass}
                  value={String(values.taxRate)}
                  onChange={(event) => update("taxRate", Number(event.target.value))}
                >
                  <option value="0">0 % — hors taxes / exonéré</option>
                  <option value="18">18 % — TVA Bénin</option>
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Prestations">
            <div className="space-y-3">
              {values.items.map((item, index) => (
                <div
                  key={item.key}
                  className="rounded-xl border border-border bg-secondary/40 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Ligne {index + 1}
                    </p>
                    {values.items.length > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setValues((prev) => ({
                            ...prev,
                            items: prev.items.filter((row) => row.key !== item.key),
                          }))
                        }
                        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-destructive hover:bg-destructive/5"
                      >
                        <Trash2 className="size-3.5" />
                        Retirer
                      </button>
                    ) : null}
                  </div>
                  <div className="grid gap-3 md:grid-cols-12">
                    <Field label="Désignation" className="block text-sm md:col-span-8">
                      <textarea
                        required
                        rows={2}
                        className={fieldClass}
                        value={item.description}
                        onChange={(event) =>
                          updateItem(item.key, { description: event.target.value })
                        }
                      />
                    </Field>
                    <Field label="Prix" className="block text-sm md:col-span-4">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        required
                        className={fieldClass}
                        value={item.unitPrice}
                        onChange={(event) =>
                          updateItem(item.key, {
                            unitPrice: Number(event.target.value),
                          })
                        }
                      />
                      <span className="mt-1 block text-xs text-muted-foreground/80">
                        {formatMoney(item.unitPrice || 0, values.currency)}
                      </span>
                    </Field>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setValues((prev) => ({ ...prev, items: [...prev.items, newItem()] }))
              }
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium transition hover:bg-accent"
            >
              <Plus className="size-4" />
              Ajouter une ligne
            </button>
          </Section>

          <Section title="Notes">
            <textarea
              rows={4}
              className={fieldClass}
              placeholder="Conditions de paiement, délais, précisions…"
              value={values.notes}
              onChange={(event) => update("notes", event.target.value)}
            />
          </Section>

          <Section title="Émetteur">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nom">
                <input
                  required
                  className={fieldClass}
                  value={values.issuerName}
                  onChange={(event) => update("issuerName", event.target.value)}
                />
              </Field>
              <Field label="Intitulé">
                <input
                  className={fieldClass}
                  value={values.issuerTitle}
                  onChange={(event) => update("issuerTitle", event.target.value)}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  required
                  className={fieldClass}
                  value={values.issuerEmail}
                  onChange={(event) => update("issuerEmail", event.target.value)}
                />
              </Field>
              <Field label="Téléphone">
                <input
                  className={fieldClass}
                  value={values.issuerPhone}
                  onChange={(event) => update("issuerPhone", event.target.value)}
                />
              </Field>
              <Field label="Adresse" className="block text-sm md:col-span-2">
                <input
                  className={fieldClass}
                  value={values.issuerAddress}
                  onChange={(event) => update("issuerAddress", event.target.value)}
                />
              </Field>
              <Field label="Ville">
                <input
                  className={fieldClass}
                  value={values.issuerCity}
                  onChange={(event) => update("issuerCity", event.target.value)}
                />
              </Field>
              <Field label="Pays">
                <input
                  className={fieldClass}
                  value={values.issuerCountry}
                  onChange={(event) => update("issuerCountry", event.target.value)}
                />
              </Field>
              <Field label="IFU (optionnel)">
                <input
                  className={fieldClass}
                  value={values.issuerIfu}
                  onChange={(event) => update("issuerIfu", event.target.value)}
                />
              </Field>
              <Field label="Site web">
                <input
                  className={fieldClass}
                  value={values.issuerWebsite}
                  onChange={(event) => update("issuerWebsite", event.target.value)}
                />
              </Field>
            </div>
          </Section>
        </div>

        <aside className="lg:sticky lg:top-24 h-fit space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Récapitulatif
            </p>
            <p className="mt-2 font-display text-lg font-semibold">
              {id ? initial?.number : "Numéro attribué à l’enregistrement"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Brouillon</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Total HT</dt>
                <dd>{formatMoney(totals.subtotal, values.currency)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  TVA {values.taxRate.toLocaleString("fr-FR")} %
                </dt>
                <dd>{formatMoney(totals.taxAmount, values.currency)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-3 font-semibold">
                <dt>Total TTC</dt>
                <dd>{formatMoney(totals.total, values.currency)}</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
              <button
                type="button"
                onClick={() =>
                  router.push(id ? `/admin/invoices/${id}` : "/admin/invoices")
                }
                className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-card px-6 text-sm font-medium text-foreground transition hover:bg-accent"
              >
                Annuler
              </button>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}

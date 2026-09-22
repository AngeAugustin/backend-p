import {
  formatDate,
  formatMoney,
  type SerializedInvoice,
} from "@/lib/invoice-shared";
import { invoicePaymentInfo } from "@/lib/invoice-issuer";
import { InvoiceStatusBadge } from "@/components/admin/InvoiceStatusBadge";

function lines(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value && value.trim()));
}

export function InvoicePreview({ invoice }: { invoice: SerializedInvoice }) {
  const clientHeading = invoice.clientCompany || invoice.clientName;
  const issuerLines = lines([
    invoice.issuerTitle,
    [invoice.issuerAddress, invoice.issuerCity, invoice.issuerCountry]
      .filter(Boolean)
      .join(" · "),
    invoice.issuerEmail,
    invoice.issuerPhone,
    invoice.issuerWebsite,
    invoice.issuerIfu ? `IFU ${invoice.issuerIfu}` : null,
  ]);
  const clientLines = lines([
    invoice.clientCompany && invoice.clientCompany !== invoice.clientName
      ? invoice.clientName
      : null,
    [invoice.clientAddress, invoice.clientCity, invoice.clientCountry]
      .filter(Boolean)
      .join(" · "),
    invoice.clientEmail,
    invoice.clientPhone,
    invoice.clientIfu ? `IFU ${invoice.clientIfu}` : null,
  ]);

  return (
    <article className="relative overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_30px_rgba(16,44,39,0.08)]">
      <div className="h-2 bg-primary" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="rotate-[-28deg] text-[64px] font-bold tracking-[0.3em] text-primary/5">
          PRO FORMA
        </span>
      </div>

      <div className="relative p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="font-display text-xl font-bold tracking-tight text-primary">
              {invoice.issuerName}
            </p>
            {invoice.issuerTitle ? (
              <p className="mt-1 text-sm text-muted-foreground">{invoice.issuerTitle}</p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="font-display text-lg font-bold tracking-[0.14em] text-primary">
              FACTURE PRO FORMA
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              N° <span className="font-semibold text-foreground">{invoice.number}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Émise le {formatDate(invoice.issuedAt)}
            </p>
            {invoice.validUntil ? (
              <p className="text-sm text-muted-foreground">
                Valable jusqu’au {formatDate(invoice.validUntil)}
              </p>
            ) : null}
            <div className="mt-2 flex justify-end">
              <InvoiceStatusBadge status={invoice.status} />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl bg-secondary/70 p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-glow">
              Émetteur
            </h3>
            <p className="mt-2 font-semibold">{invoice.issuerName}</p>
            <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
              {issuerLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </section>
          <section className="rounded-xl bg-secondary/70 p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-glow">
              Client
            </h3>
            <p className="mt-2 font-semibold">{clientHeading}</p>
            <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
              {clientLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-8 overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider">
                  Désignation
                </th>
                <th className="min-w-[9.5rem] px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider">
                  P.U.
                </th>
                <th className="min-w-[10.5rem] px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider">
                  Montant
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr
                  key={`${item.description}-${index}`}
                  className="border-t border-border/70 even:bg-secondary/40"
                >
                  <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-3 whitespace-pre-wrap">{item.description}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {formatMoney(item.unitPrice, invoice.currency)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                    {formatMoney(item.amount, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 ml-auto w-full max-w-[20rem] overflow-hidden rounded-xl border border-border">
          <div className="flex justify-between gap-6 px-4 py-2.5 text-sm">
            <span>Total HT</span>
            <span className="whitespace-nowrap">
              {formatMoney(invoice.subtotal, invoice.currency)}
            </span>
          </div>
          <div className="flex justify-between gap-6 border-t border-border px-4 py-2.5 text-sm">
            <span>TVA {invoice.taxRate.toLocaleString("fr-FR")} %</span>
            <span className="whitespace-nowrap">
              {formatMoney(invoice.taxAmount, invoice.currency)}
            </span>
          </div>
          <div className="flex justify-between gap-6 bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
            <span>Total TTC</span>
            <span className="whitespace-nowrap">
              {formatMoney(invoice.total, invoice.currency)}
            </span>
          </div>
        </div>

        {invoice.notes ? (
          <section className="mt-8 rounded-xl border border-border p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-glow">
              Notes
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {invoice.notes}
            </p>
          </section>
        ) : null}

        <div className="mt-10 flex flex-wrap items-end justify-between gap-8">
          <section className="max-w-sm rounded-xl border border-border bg-secondary/70 p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-glow">
              Informations de paiement
            </h3>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <p>
                Moyen :{" "}
                <span className="font-semibold text-foreground">
                  {invoicePaymentInfo.method}
                </span>
              </p>
              <p>
                Numéro :{" "}
                <span className="font-semibold text-foreground">
                  {invoicePaymentInfo.number}
                </span>
              </p>
              <p>
                Nom :{" "}
                <span className="font-semibold text-foreground">
                  {invoicePaymentInfo.accountName}
                </span>
              </p>
            </div>
          </section>

          <div className="w-[160px] text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Signature
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/signature.png"
              alt={`Signature de ${invoice.issuerName}`}
              className="mt-2 ml-auto h-16 w-[140px] object-cover object-left invert"
            />
            <p className="mt-1 text-sm font-medium text-foreground">
              {invoice.issuerName}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

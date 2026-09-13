import {
  Document,
  Image,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import {
  formatDate,
  formatMoney,
  pdfSafeText,
  type SerializedInvoice,
} from "@/lib/invoice-shared";
import { getInvoiceSignatureSrc } from "@/lib/invoice-signature";

const colors = {
  forest: "#102c27",
  glow: "#3d8b7a",
  ink: "#0a1210",
  muted: "#5a6f6a",
  line: "#d7e4e0",
  paper: "#ffffff",
  wash: "#f4faf8",
  amber: "#b45309",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: colors.ink,
    backgroundColor: colors.paper,
    paddingTop: 36,
    paddingBottom: 72,
    paddingHorizontal: 40,
  },
  watermark: {
    position: "absolute",
    top: 320,
    left: 48,
    fontSize: 52,
    color: colors.forest,
    opacity: 0.055,
    letterSpacing: 6,
    textTransform: "uppercase",
    transform: "rotate(-28deg)",
  },
  topRule: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: colors.forest,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  brandName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: colors.forest,
    letterSpacing: 0.2,
  },
  brandTitle: {
    marginTop: 3,
    fontSize: 9,
    color: colors.muted,
  },
  docLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    color: colors.forest,
    textAlign: "right",
    letterSpacing: 1.2,
  },
  docMeta: {
    marginTop: 8,
    textAlign: "right",
    fontSize: 9,
    color: colors.muted,
  },
  docNumber: {
    fontFamily: "Helvetica-Bold",
    color: colors.ink,
    fontSize: 10,
  },
  parties: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  party: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 6,
    padding: 12,
    backgroundColor: colors.wash,
  },
  partyLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: colors.glow,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  partyName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginBottom: 4,
  },
  partyLine: {
    fontSize: 9,
    color: colors.muted,
    lineHeight: 1.45,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.forest,
    color: "#f4faf8",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.line,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableRowAlt: {
    backgroundColor: colors.wash,
  },
  colIndex: { width: "8%" },
  colDesc: { width: "52%" },
  colPrice: { width: "20%", textAlign: "right" },
  colAmount: { width: "20%", textAlign: "right" },
  headerCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  totalsWrap: {
    marginTop: 16,
    alignItems: "flex-end",
  },
  totals: {
    width: 268,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 6,
    overflow: "hidden",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  totalGrand: {
    backgroundColor: colors.forest,
    color: "#f4faf8",
  },
  notes: {
    marginTop: 22,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 6,
  },
  notesTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    letterSpacing: 1.2,
    color: colors.glow,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  signatureBlock: {
    marginTop: 22,
    alignItems: "flex-end",
  },
  signatureLabel: {
    fontSize: 8,
    color: colors.muted,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  signatureImage: {
    width: 118,
    height: 58,
    objectFit: "contain",
  },
  signatureName: {
    marginTop: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: colors.forest,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: colors.muted,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 8,
  },
});

function partyLines(invoice: SerializedInvoice, side: "issuer" | "client") {
  if (side === "issuer") {
    return [
      invoice.issuerTitle,
      [invoice.issuerAddress, invoice.issuerCity, invoice.issuerCountry]
        .filter(Boolean)
        .join(" · "),
      invoice.issuerEmail,
      invoice.issuerPhone,
      invoice.issuerWebsite,
      invoice.issuerIfu ? `IFU ${invoice.issuerIfu}` : null,
    ].filter(Boolean) as string[];
  }

  return [
    invoice.clientCompany && invoice.clientCompany !== invoice.clientName
      ? invoice.clientName
      : null,
    [invoice.clientAddress, invoice.clientCity, invoice.clientCountry]
      .filter(Boolean)
      .join(" · "),
    invoice.clientEmail,
    invoice.clientPhone,
    invoice.clientIfu ? `IFU ${invoice.clientIfu}` : null,
  ].filter(Boolean) as string[];
}

export function InvoicePdfDocument({ invoice }: { invoice: SerializedInvoice }) {
  const clientHeading = invoice.clientCompany || invoice.clientName;
  const signatureSrc = getInvoiceSignatureSrc();
  const money = (amount: number) =>
    pdfSafeText(formatMoney(amount, invoice.currency));

  return (
    <Document
      title={`Facture proforma ${invoice.number}`}
      author={invoice.issuerName}
      subject={`Facture PRO FORMA ${invoice.number}`}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.topRule} fixed />
        <Text style={styles.watermark} fixed>
          PRO FORMA
        </Text>

        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>{invoice.issuerName}</Text>
            {invoice.issuerTitle ? (
              <Text style={styles.brandTitle}>{invoice.issuerTitle}</Text>
            ) : null}
          </View>
          <View>
            <Text style={styles.docLabel}>FACTURE PRO FORMA</Text>
            <Text style={styles.docMeta}>
              N° <Text style={styles.docNumber}>{invoice.number}</Text>
            </Text>
            <Text style={styles.docMeta}>Emise le {pdfSafeText(formatDate(invoice.issuedAt))}</Text>
            {invoice.validUntil ? (
              <Text style={styles.docMeta}>
                Valable jusqu'au {pdfSafeText(formatDate(invoice.validUntil))}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.parties}>
          <View style={styles.party}>
            <Text style={styles.partyLabel}>Émetteur</Text>
            <Text style={styles.partyName}>{invoice.issuerName}</Text>
            {partyLines(invoice, "issuer").map((line) => (
              <Text key={line} style={styles.partyLine}>
                {line}
              </Text>
            ))}
          </View>
          <View style={styles.party}>
            <Text style={styles.partyLabel}>Client</Text>
            <Text style={styles.partyName}>{clientHeading}</Text>
            {partyLines(invoice, "client").map((line) => (
              <Text key={line} style={styles.partyLine}>
                {line}
              </Text>
            ))}
          </View>
        </View>

        <View>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.colIndex]}>#</Text>
            <Text style={[styles.headerCell, styles.colDesc]}>Désignation</Text>
            <Text style={[styles.headerCell, styles.colPrice]}>P.U.</Text>
            <Text style={[styles.headerCell, styles.colAmount]}>Montant</Text>
          </View>
          {invoice.items.map((item, index) => (
            <View
              key={`${item.description}-${index}`}
              style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
              wrap={false}
            >
              <Text style={styles.colIndex}>{index + 1}</Text>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colPrice}>{money(item.unitPrice)}</Text>
              <Text style={styles.colAmount}>{money(item.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsWrap}>
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text>Total HT</Text>
              <Text>{money(invoice.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>
                TVA {pdfSafeText(invoice.taxRate.toLocaleString("fr-FR"))} %
              </Text>
              <Text>{money(invoice.taxAmount)}</Text>
            </View>
            <View style={[styles.totalRow, styles.totalGrand]}>
              <Text>Total TTC</Text>
              <Text>{money(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {invoice.notes ? (
          <View style={styles.notes} wrap={false}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text>{invoice.notes}</Text>
          </View>
        ) : null}

        <View style={styles.signatureBlock} wrap={false}>
          <Text style={styles.signatureLabel}>Signature</Text>
          {signatureSrc ? (
            <Image src={signatureSrc} style={styles.signatureImage} />
          ) : null}
          <Text style={styles.signatureName}>{invoice.issuerName}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>{invoice.issuerName}</Text>
          <Text>
            {invoice.number} · page{" "}
            <Text
              render={({ pageNumber, totalPages }) =>
                `${pageNumber} / ${totalPages}`
              }
            />
          </Text>
        </View>
      </Page>
    </Document>
  );
}

import { InvoiceForm } from "@/components/admin/InvoiceForm";
import { defaultValidUntilInput, toDateInput } from "@/lib/invoice-shared";

export default function NewInvoicePage() {
  const issuedAt = toDateInput(new Date());

  return (
    <InvoiceForm
      defaultIssuedAt={issuedAt}
      defaultValidUntil={defaultValidUntilInput()}
    />
  );
}

import type { InvoiceStatus } from "@/lib/invoice-shared";
import { INVOICE_STATUS_LABELS } from "@/lib/invoice-shared";
import { cn } from "@/lib/utils";

const statusClass: Record<InvoiceStatus, string> = {
  draft: "bg-amber-50 text-amber-700",
  finalized: "bg-emerald-50 text-emerald-700",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-medium",
        statusClass[status] || "bg-muted text-muted-foreground"
      )}
    >
      {INVOICE_STATUS_LABELS[status] || status}
    </span>
  );
}

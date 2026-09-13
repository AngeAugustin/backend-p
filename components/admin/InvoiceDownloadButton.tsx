"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { adminDownload } from "@/lib/admin-client";
import { invoicePdfFilename } from "@/lib/invoice-shared";
import { cn } from "@/lib/utils";

export function InvoiceDownloadButton({
  id,
  number,
  compact = false,
  className,
}: {
  id: string;
  number: string;
  compact?: boolean;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setLoading(true);
    setError(null);
    try {
      await adminDownload(
        `/api/admin/invoices/${id}/pdf`,
        invoicePdfFilename(number)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Téléchargement impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("inline-flex flex-col items-start", className)}>
      <button
        type="button"
        disabled={loading}
        onClick={() => void download()}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full text-sm text-foreground transition hover:bg-accent disabled:opacity-60",
          compact
            ? "px-3 py-1.5"
            : "h-11 gap-2 border border-border bg-card px-5 font-medium"
        )}
      >
        {loading ? (
          <Loader2 className={cn("animate-spin", compact ? "size-3.5" : "size-4")} />
        ) : (
          <Download className={compact ? "size-3.5" : "size-4"} />
        )}
        Télécharger
      </button>
      {error ? <span className="mt-1 text-xs text-destructive">{error}</span> : null}
    </div>
  );
}

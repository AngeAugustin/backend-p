"use client";

import { useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-client";
import type { ResourceConfig } from "@/lib/admin-resources";
import { cn } from "@/lib/utils";

type DuplicateResourceButtonProps = {
  resource: ResourceConfig;
  id: string;
  className?: string;
  compact?: boolean;
};

export function DuplicateResourceButton({
  resource,
  id,
  className,
  compact = false,
}: DuplicateResourceButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!resource.duplicable) return null;

  async function onDuplicate() {
    setLoading(true);
    setError(null);

    try {
      const response = await adminFetch<{ data: { id: string } }>(
        `${resource.apiPath}/${id}/duplicate`,
        { method: "POST" }
      );
      router.push(`/admin/${resource.key}/${response.data.id}/edit`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Duplication impossible");
      setLoading(false);
    }
  }

  return (
    <div className={cn("inline-flex flex-col items-start", className)}>
      <button
        type="button"
        disabled={loading}
        onClick={() => void onDuplicate()}
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
          <Copy className={compact ? "size-3.5" : "size-4"} />
        )}
        Dupliquer
      </button>
      {error ? <span className="mt-1 text-xs text-destructive">{error}</span> : null}
    </div>
  );
}

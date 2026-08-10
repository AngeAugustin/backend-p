import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import type { ResourceConfig } from "@/lib/admin-resources";
import { PageHeader } from "@/components/admin/PageHeader";
import { cn } from "@/lib/utils";

function formatValue(
  fieldName: string,
  fieldType: string,
  value: unknown,
  data: Record<string, unknown>
) {
  if (fieldType === "publish") {
    return data.publishedAt ? "Publié" : "Brouillon";
  }
  if (fieldType === "checkbox") {
    return value ? "Oui" : "Non";
  }
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "Oui" : "Non";
  }
  return String(value);
}

export function ResourceDetail({
  resource,
  data,
  id,
}: {
  resource: ResourceConfig;
  data: Record<string, unknown>;
  id: string;
}) {
  const title = String(data[resource.titleField] ?? resource.singular);
  const subtitle = resource.subtitleField
    ? String(data[resource.subtitleField] ?? "")
    : "";
  const published = Boolean(data.publishedAt);
  const imageUrl =
    typeof data.coverUrl === "string" && data.coverUrl
      ? data.coverUrl
      : typeof data.imageUrl === "string"
        ? data.imageUrl
        : null;

  return (
    <div>
      <PageHeader
        title={title}
        description={
          subtitle
            ? `${resource.singular} · ${subtitle}`
            : `Détail ${resource.singular.toLowerCase()}`
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/${resource.key}`}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium transition hover:bg-accent"
            >
              <ArrowLeft className="size-4" />
              Retour
            </Link>
            <Link
              href={`/admin/${resource.key}/${id}/edit`}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              <Pencil className="size-4" />
              Éditer
            </Link>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {String(data.locale ?? "—")}
        </span>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            published ? "bg-glow/10 text-glow" : "bg-amber-50 text-amber-700"
          )}
        >
          {published ? "Publié" : "Brouillon"}
        </span>
        {typeof data.category === "string" ? (
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            {data.category}
          </span>
        ) : null}
      </div>

      {imageUrl ? (
        <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className="max-h-72 w-full object-cover object-center"
          />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {resource.fields
          .filter((field) => field.type !== "publish")
          .map((field) => {
            const raw = data[field.name];
            const display = formatValue(field.name, field.type, raw, data);
            const isLong =
              field.type === "textarea" ||
              (typeof display === "string" && display.length > 120);

            return (
              <section
                key={field.name}
                className={cn(
                  "rounded-2xl border border-border bg-card p-5 shadow-sm",
                  isLong && "md:col-span-2"
                )}
              >
                <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {field.label}
                </h3>
                <div
                  className={cn(
                    "mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground",
                    field.type === "textarea" && "text-[15px]"
                  )}
                >
                  {display}
                </div>
              </section>
            );
          })}

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm md:col-span-2">
          <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Métadonnées
          </h3>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Statut</dt>
              <dd className="mt-1 font-medium">
                {published ? "Publié" : "Brouillon"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Créé le</dt>
              <dd className="mt-1 font-medium">
                {data.createdAt
                  ? new Date(String(data.createdAt)).toLocaleString("fr-FR")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Modifié le</dt>
              <dd className="mt-1 font-medium">
                {data.updatedAt
                  ? new Date(String(data.updatedAt)).toLocaleString("fr-FR")
                  : "—"}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

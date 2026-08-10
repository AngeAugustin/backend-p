"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { adminFetch } from "@/lib/admin-client";
import type { ResourceConfig } from "@/lib/admin-resources";
import { PageHeader } from "@/components/admin/PageHeader";

type Values = Record<string, unknown>;

const fieldClass =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30";

function defaultsFromResource(resource: ResourceConfig, initial?: Values): Values {
  const values: Values = { locale: "fr", publish: true };
  for (const field of resource.fields) {
    if (field.type === "checkbox") values[field.name] = false;
    if (field.type === "number") values[field.name] = 0;
    if (field.type === "select" && field.options?.[0]) {
      values[field.name] = field.options[0].value;
    }
    if (field.type === "locale") values[field.name] = "fr";
    if (field.type === "publish") values[field.name] = true;
  }
  if (initial) {
    Object.assign(values, initial);
    values.publish = Boolean(initial.publishedAt);
  }
  return values;
}

export function ResourceForm({
  resource,
  initial,
  id,
}: {
  resource: ResourceConfig;
  initial?: Values;
  id?: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(() =>
    defaultsFromResource(resource, initial)
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const title = useMemo(
    () => (id ? `Éditer ${resource.singular}` : `Nouveau ${resource.singular}`),
    [id, resource.singular]
  );

  function update(name: string, value: unknown) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload: Values = { ...values };
    payload.publish = Boolean(values.publish);
    if (!payload.publish) payload.publishedAt = null;

    try {
      if (id) {
        await adminFetch(`${resource.apiPath}/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await adminFetch(resource.apiPath, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      if (id) {
        router.push(`/admin/${resource.key}/${id}`);
      } else {
        router.push(`/admin/${resource.key}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <PageHeader
        title={title}
        description="Les champs multilignes acceptent une entrée par ligne (stack, tags…)."
        actions={
          id ? (
            <Link
              href={`/admin/${resource.key}/${id}`}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium transition hover:bg-accent"
            >
              <ArrowLeft className="size-4" />
              Voir le détail
            </Link>
          ) : null
        }
      />

      {error ? (
        <p className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6 md:grid-cols-2">
        {resource.fields.map((field) => {
          const value = values[field.name];

          if (field.type === "checkbox" || field.type === "publish") {
            return (
              <label
                key={field.name}
                className="flex items-center gap-3 rounded-xl bg-secondary/50 px-4 py-3 text-sm md:col-span-2"
              >
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(event) => update(field.name, event.target.checked)}
                  className="size-4 rounded border-input text-primary accent-primary"
                />
                <span className="font-medium">{field.label}</span>
              </label>
            );
          }

          if (field.type === "locale" || field.type === "select") {
            return (
              <label key={field.name} className="block text-sm">
                <span className="mb-1.5 block font-medium text-muted-foreground">
                  {field.label}
                </span>
                <select
                  required={field.required}
                  value={String(value ?? "")}
                  onChange={(event) => update(field.name, event.target.value)}
                  className={fieldClass}
                >
                  {field.type === "locale" ? (
                    <>
                      <option value="fr">fr</option>
                      <option value="en">en</option>
                    </>
                  ) : (
                    field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))
                  )}
                </select>
              </label>
            );
          }

          if (field.type === "textarea") {
            return (
              <label key={field.name} className="block text-sm md:col-span-2">
                <span className="mb-1.5 block font-medium text-muted-foreground">
                  {field.label}
                </span>
                <textarea
                  required={field.required}
                  rows={field.rows || 4}
                  value={String(value ?? "")}
                  onChange={(event) => update(field.name, event.target.value)}
                  className={fieldClass}
                />
              </label>
            );
          }

          return (
            <label key={field.name} className="block text-sm">
              <span className="mb-1.5 block font-medium text-muted-foreground">
                {field.label}
              </span>
              <input
                type={field.type === "number" ? "number" : "text"}
                required={field.required}
                value={
                  field.type === "number"
                    ? Number(value ?? 0)
                    : String(value ?? "")
                }
                onChange={(event) =>
                  update(
                    field.name,
                    field.type === "number"
                      ? Number(event.target.value)
                      : event.target.value
                  )
                }
                className={fieldClass}
              />
            </label>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={() =>
            router.push(
              id ? `/admin/${resource.key}/${id}` : `/admin/${resource.key}`
            )
          }
          className="inline-flex h-11 items-center rounded-full border border-border bg-card px-6 text-sm font-medium text-foreground transition hover:bg-accent"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

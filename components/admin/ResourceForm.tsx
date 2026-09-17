"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { adminFetch } from "@/lib/admin-client";
import type { FieldConfig, ResourceConfig } from "@/lib/admin-resources";
import { slugify } from "@/lib/bilingual";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import {
  LocalizedField,
  type LocalizedString,
} from "@/components/admin/LocalizedField";
import { PageHeader } from "@/components/admin/PageHeader";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

type Values = Record<string, unknown>;

const fieldClass =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30";

function draftStorageKey(resourceKey: string, id?: string) {
  return `portfolio-admin-draft:${resourceKey}:${id || "new"}`;
}

function readDraft(resourceKey: string, id?: string): Values | null {
  try {
    const raw = localStorage.getItem(draftStorageKey(resourceKey, id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { values?: Values };
    if (!parsed?.values || typeof parsed.values !== "object") return null;
    return parsed.values;
  } catch {
    return null;
  }
}

function writeDraft(resourceKey: string, id: string | undefined, values: Values) {
  try {
    localStorage.setItem(
      draftStorageKey(resourceKey, id),
      JSON.stringify({ values, savedAt: new Date().toISOString() })
    );
  } catch {
    // quota / private mode
  }
}

function clearDraft(resourceKey: string, id?: string) {
  try {
    localStorage.removeItem(draftStorageKey(resourceKey, id));
  } catch {
    // ignore
  }
}

function emptyLocalized(): LocalizedString {
  return { fr: "", en: "" };
}

function defaultsFromResource(
  resource: ResourceConfig,
  initial?: Values,
  bilingual = false
): Values {
  const values: Values = { locale: "fr", publish: true };
  for (const field of resource.fields) {
    if (bilingual && field.localized) {
      values[field.name] = emptyLocalized();
      continue;
    }
    if (field.type === "checkbox") values[field.name] = false;
    if (field.type === "number") values[field.name] = 0;
    if (field.type === "select" && field.options?.[0]) {
      values[field.name] = field.options[0].value;
    }
    if (field.type === "locale") values[field.name] = "fr";
    if (field.type === "publish") values[field.name] = true;
    if (field.type === "image") values[field.name] = "";
  }
  if (initial) {
    Object.assign(values, initial);
    values.publish = Boolean(initial.publishedAt);
  }
  return values;
}

function asLocalized(value: unknown): LocalizedString {
  if (
    value &&
    typeof value === "object" &&
    "fr" in value &&
    "en" in value
  ) {
    const record = value as LocalizedString;
    return {
      fr: String(record.fr ?? ""),
      en: String(record.en ?? ""),
    };
  }
  return emptyLocalized();
}

function titleSourceForSlug(value: unknown, bilingual: boolean) {
  if (bilingual) return asLocalized(value).fr;
  return String(value ?? "");
}

type SlugManualState = { fr: boolean; en: boolean };

function SharedField({
  field,
  value,
  onChange,
  resourceKey,
}: {
  field: FieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  resourceKey: string;
}) {
  if (field.type === "checkbox" || field.type === "publish") {
    return (
      <label className="flex items-center gap-3 rounded-xl bg-secondary/50 px-4 py-3 text-sm md:col-span-2">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          className="size-4 rounded border-input text-primary accent-primary"
        />
        <span className="font-medium">{field.label}</span>
      </label>
    );
  }

  if (field.type === "locale" || field.type === "select") {
    return (
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-muted-foreground">
          {field.label}
        </span>
        <select
          required={field.required}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
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

  if (field.type === "image") {
    const folder =
      resourceKey === "projects" || resourceKey === "articles"
        ? resourceKey
        : "misc";

    return (
      <ImageUploadField
        label={field.label}
        value={String(value ?? "")}
        folder={folder}
        onChange={(next) => onChange(next)}
      />
    );
  }

  if (field.type === "richtext") {
    return (
      <div className="block text-sm md:col-span-2">
        <span className="mb-1.5 block font-medium text-muted-foreground">
          {field.label}
        </span>
        <RichTextEditor
          value={String(value ?? "")}
          onChange={(next) => onChange(next)}
        />
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <label className="block text-sm md:col-span-2">
        <span className="mb-1.5 block font-medium text-muted-foreground">
          {field.label}
        </span>
        <textarea
          required={field.required}
          rows={field.rows || 4}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          className={fieldClass}
        />
      </label>
    );
  }

  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-muted-foreground">
        {field.label}
      </span>
      <input
        type={field.type === "number" ? "number" : "text"}
        required={field.required}
        value={
          field.type === "number" ? Number(value ?? 0) : String(value ?? "")
        }
        onChange={(event) =>
          onChange(
            field.type === "number"
              ? Number(event.target.value)
              : event.target.value
          )
        }
        className={fieldClass}
      />
      {field.help ? (
        <span className="mt-1.5 block text-xs text-muted-foreground">
          {field.help}
        </span>
      ) : null}
    </label>
  );
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
  const bilingual = Boolean(resource.bilingualCreate && !id);
  const baselineRef = useRef<Values>(
    defaultsFromResource(resource, initial, bilingual)
  );
  const [values, setValues] = useState<Values>(() => baselineRef.current);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [dirty, setDirty] = useState(false);
  const slugManualRef = useRef<SlugManualState>({ fr: false, en: false });

  useEffect(() => {
    const draft = readDraft(resource.key, id);
    if (draft) {
      setValues(draft);
      setDraftRestored(true);
      setDirty(true);
    }
    setHydrated(true);
  }, [resource.key, id]);

  useEffect(() => {
    if (!hydrated || !dirty) return;
    const timer = window.setTimeout(() => {
      writeDraft(resource.key, id, values);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [values, hydrated, dirty, resource.key, id]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const title = useMemo(
    () => (id ? `Éditer ${resource.singular}` : `Nouveau ${resource.singular}`),
    [id, resource.singular]
  );

  const visibleFields = useMemo(
    () =>
      resource.fields.filter((field) => {
        if (bilingual && field.type === "locale") return false;
        return true;
      }),
    [resource.fields, bilingual]
  );

  const localizedFields = useMemo(
    () => (bilingual ? resource.fields.filter((field) => field.localized) : []),
    [resource.fields, bilingual]
  );

  const sharedFields = useMemo(
    () =>
      visibleFields.filter((field) => !(bilingual && field.localized)),
    [visibleFields, bilingual]
  );

  const slugIsLocalized = Boolean(
    bilingual && resource.fields.some((field) => field.name === "slug" && field.localized)
  );

  function discardDraft() {
    clearDraft(resource.key, id);
    setValues(baselineRef.current);
    setDraftRestored(false);
    setDirty(false);
    setError(null);
  }

  function update(name: string, value: unknown) {
    setDirty(true);
    setValues((prev) => {
      const next: Values = { ...prev, [name]: value };

      if (name === "slug") {
        if (slugIsLocalized) {
          const pair = asLocalized(value);
          const prevPair = asLocalized(prev.slug);
          if (pair.fr !== prevPair.fr) {
            slugManualRef.current.fr = pair.fr.trim().length > 0;
          }
          if (pair.en !== prevPair.en) {
            slugManualRef.current.en = pair.en.trim().length > 0;
          }
        } else {
          const manual = String(value ?? "").trim().length > 0;
          slugManualRef.current = { fr: manual, en: manual };
        }
      }

      if (resource.autoSlugFromTitle && name === "title") {
        if (slugIsLocalized) {
          const titles = asLocalized(value);
          const currentSlug = asLocalized(prev.slug);
          next.slug = {
            fr: slugManualRef.current.fr
              ? currentSlug.fr
              : slugify(titles.fr),
            en: slugManualRef.current.en
              ? currentSlug.en
              : slugify(titles.en),
          };
        } else if (!slugManualRef.current.fr) {
          next.slug = slugify(titleSourceForSlug(value, bilingual));
        }
      }

      return next;
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (bilingual) {
        const locales = {
          fr: {} as Record<string, unknown>,
          en: {} as Record<string, unknown>,
        };

        for (const field of localizedFields) {
          const pair = asLocalized(values[field.name]);
          locales.fr[field.name] = pair.fr;
          locales.en[field.name] = pair.en;
        }

        const payload: Values = {
          bilingual: true,
          locales,
          publish: Boolean(values.publish),
        };

        for (const field of sharedFields) {
          if (field.type === "locale") continue;
          payload[field.name] = values[field.name];
        }

        if (resource.autoSlugFromTitle) {
          if (!String(locales.fr.slug ?? "").trim()) {
            locales.fr.slug = slugify(String(locales.fr.title ?? ""));
          }
          if (!String(locales.en.slug ?? "").trim()) {
            locales.en.slug = slugify(String(locales.en.title ?? ""));
          }
          if (
            !slugIsLocalized &&
            (!payload.slug || !String(payload.slug).trim())
          ) {
            payload.slug = slugify(String(locales.fr.title ?? ""));
          }
        }

        if (payload.publish) {
          delete payload.publishedAt;
        } else {
          payload.publishedAt = null;
        }

        await adminFetch(resource.apiPath, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        clearDraft(resource.key, id);
        setDirty(false);
        router.push(`/admin/${resource.key}`);
      } else {
        const payload: Values = { ...values };
        payload.publish = Boolean(values.publish);

        if (
          resource.autoSlugFromTitle &&
          (!payload.slug || !String(payload.slug).trim())
        ) {
          payload.slug = slugify(String(payload.title ?? ""));
        }

        if (payload.publish) {
          delete payload.publishedAt;
        } else {
          payload.publishedAt = null;
        }

        if (id) {
          await adminFetch(`${resource.apiPath}/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          clearDraft(resource.key, id);
          setDirty(false);
          router.push(`/admin/${resource.key}/${id}`);
        } else {
          await adminFetch(resource.apiPath, {
            method: "POST",
            body: JSON.stringify(payload),
          });
          clearDraft(resource.key, id);
          setDirty(false);
          router.push(`/admin/${resource.key}`);
        }
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
        description={
          bilingual
            ? slugIsLocalized
              ? "Remplis FR et EN en une fois : deux entrées seront créées (slugs séparés)."
              : "Remplis FR et EN en une fois : deux entrées seront créées (même slug)."
            : "Les champs multilignes acceptent une entrée par ligne (stack, tags…)."
        }
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

      {draftRestored ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p>
            Brouillon local restauré (ex. image ajoutée avant refresh). Pense à
            cliquer sur <strong>Enregistrer</strong> pour le publier en base.
          </p>
          <button
            type="button"
            onClick={discardDraft}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-amber-600/20 bg-white px-3 text-xs font-medium transition hover:bg-amber-100"
          >
            <RotateCcw className="size-3.5" />
            Ignorer le brouillon
          </button>
        </div>
      ) : null}

      {bilingual ? (
        <p className="mb-4 rounded-xl border border-glow/20 bg-glow/5 px-4 py-3 text-sm text-foreground/90">
          Création bilingue : un clic enregistre la version française et la
          version anglaise.
        </p>
      ) : null}

      <div className="grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6 md:grid-cols-2">
        {visibleFields.map((field) =>
          bilingual && field.localized ? (
            <LocalizedField
              key={field.name}
              label={field.label}
              value={asLocalized(values[field.name])}
              onChange={(next) => update(field.name, next)}
              multiline={field.type === "textarea"}
              richtext={field.type === "richtext"}
              rows={field.rows || 4}
              required={field.required}
            />
          ) : (
            <SharedField
              key={field.name}
              field={field}
              value={values[field.name]}
              onChange={(next) => update(field.name, next)}
              resourceKey={resource.key}
            />
          )
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          {saving
            ? "Enregistrement…"
            : bilingual
              ? "Créer FR + EN"
              : "Enregistrer"}
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

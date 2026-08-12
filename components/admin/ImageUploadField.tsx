"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { adminUpload } from "@/lib/admin-client";

const fieldClass =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30";

type ImageUploadFieldProps = {
  label: string;
  value: string;
  folder: string;
  onChange: (value: string) => void;
};

export function ImageUploadField({
  label,
  value,
  folder,
  onChange,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await adminUpload<{ url: string }>("/api/admin/upload", formData);
      onChange(response.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'upload");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="block text-sm md:col-span-2">
      <span className="mb-1.5 block font-medium text-muted-foreground">{label}</span>

      {value ? (
        <div className="mb-3 overflow-hidden rounded-xl border border-border bg-secondary/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="max-h-48 w-full object-cover object-center"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={onFileSelected}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium transition hover:bg-accent disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImagePlus className="size-4" />
          )}
          {uploading ? "Upload…" : value ? "Remplacer l'image" : "Uploader une image"}
        </button>

        {value ? (
          <button
            type="button"
            disabled={uploading}
            onClick={() => onChange("")}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-muted-foreground transition hover:bg-accent disabled:opacity-60"
          >
            <X className="size-4" />
            Supprimer
          </button>
        ) : null}
      </div>

      <label className="mt-3 block">
        <span className="mb-1.5 block text-xs text-muted-foreground">
          Ou coller une URL externe
        </span>
        <input
          type="url"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://…"
          className={fieldClass}
        />
      </label>

      {error ? (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          JPEG, PNG, WebP, GIF ou SVG — max. 5 Mo
        </p>
      )}
    </div>
  );
}

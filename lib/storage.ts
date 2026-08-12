import { randomBytes } from "node:crypto";

import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || "portfolio-images";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};

export function isStorageConfigured(): boolean {
  return isSupabaseConfigured();
}

export function getPublicStorageUrl(objectPath: string): string {
  const url = process.env.SUPABASE_URL;
  if (!url) {
    throw new Error("SUPABASE_URL is not set");
  }

  const encodedPath = objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${url}/storage/v1/object/public/${STORAGE_BUCKET}/${encodedPath}`;
}

function sanitizeFolder(folder: string): string {
  const cleaned = folder.replace(/[^a-z0-9-]/gi, "").toLowerCase();
  return cleaned || "misc";
}

function buildStoragePath(folder: string, contentType: string): string {
  const ext = MIME_TO_EXT[contentType];
  if (!ext) {
    throw new Error("Unsupported image type");
  }

  const id = `${Date.now()}-${randomBytes(8).toString("hex")}`;
  return `${sanitizeFolder(folder)}/${id}${ext}`;
}

export function validateImageUpload(
  file: File | { size: number; type: string },
): string | null {
  if (!file.size) {
    return "Le fichier est vide";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "L'image ne doit pas dépasser 5 Mo";
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return "Format non supporté (JPEG, PNG, WebP, GIF, SVG uniquement)";
  }

  return null;
}

export async function uploadImage(
  file: Buffer,
  contentType: string,
  folder = "misc",
): Promise<{ url: string; path: string }> {
  if (!isStorageConfigured()) {
    throw new Error(
      "Supabase Storage is not configured (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)",
    );
  }

  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    throw new Error("Unsupported image type");
  }

  const objectPath = buildStoragePath(folder, contentType);
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(objectPath, file, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return {
    path: objectPath,
    url: getPublicStorageUrl(objectPath),
  };
}

import { requireAdmin } from "@/lib/auth";
import { json } from "@/lib/api";
import {
  isStorageConfigured,
  uploadImage,
  validateImageUpload,
} from "@/lib/storage";

const ALLOWED_FOLDERS = new Set(["projects", "articles", "misc"]);

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStorageConfigured()) {
    return json(
      {
        error:
          "Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return json({ error: "Missing file" }, { status: 400 });
    }

    const validationError = validateImageUpload(file);
    if (validationError) {
      return json({ error: validationError }, { status: 400 });
    }

    const folderParam = formData.get("folder");
    const folder =
      typeof folderParam === "string" && ALLOWED_FOLDERS.has(folderParam)
        ? folderParam
        : "misc";

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadImage(buffer, file.type, folder);

    return json({ data: result }, { status: 201 });
  } catch (error) {
    return json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 400 },
    );
  }
}

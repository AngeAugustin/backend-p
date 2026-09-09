import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { assertIngestConfigured, runRagIngest } from "@/lib/rag/runIngest";

/** Full reindex can take a while (embeddings). */
export const maxDuration = 300;

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    assertIngestConfigured();
  } catch (error) {
    return NextResponse.json(
      {
        error: "RAG is not configured",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 503 },
    );
  }

  try {
    const result = await runRagIngest(["fr", "en"]);
    return NextResponse.json({
      ok: true,
      message: "Chat index rebuilt from database + markdown.",
      result,
    });
  } catch (error) {
    console.error("[/api/admin/rag/reindex]", error);
    return NextResponse.json(
      {
        error: "Reindex failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

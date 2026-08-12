import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { json } from "@/lib/api";
import { listResponse, serializeEntry } from "@/lib/serialize";

type Serializable = Parameters<typeof serializeEntry>[0];

type CollectionHandlers<TCreate> = {
  list: (locale?: string | null) => Promise<Serializable[]>;
  create: (data: TCreate) => Promise<Serializable>;
};

type ItemHandlers<TUpdate> = {
  get: (id: string) => Promise<Serializable | null>;
  update: (id: string, data: TUpdate) => Promise<Serializable>;
  remove: (id: string) => Promise<unknown>;
};

export function createAdminCollectionHandlers<TCreate>(
  handlers: CollectionHandlers<TCreate>
) {
  return {
    async GET(request: NextRequest) {
      const admin = await requireAdmin();
      if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

      const locale = request.nextUrl.searchParams.get("locale");
      const rows = await handlers.list(locale);
      return json(listResponse(rows.map(serializeEntry)));
    },

    async POST(request: NextRequest) {
      const admin = await requireAdmin();
      if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

      try {
        const body = (await request.json()) as TCreate;
        const created = await handlers.create(body);
        return json({ data: serializeEntry(created) }, { status: 201 });
      } catch (error) {
        return json(
          {
            error: "Create failed",
            details: error instanceof Error ? error.message : String(error),
          },
          { status: 400 }
        );
      }
    },
  };
}

export function createAdminItemHandlers<TUpdate>(handlers: ItemHandlers<TUpdate>) {
  return {
    async GET(
      _request: NextRequest,
      context: { params: Promise<{ id: string }> }
    ) {
      const admin = await requireAdmin();
      if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

      const { id } = await context.params;
      const row = await handlers.get(id);
      if (!row) return json({ error: "Not found" }, { status: 404 });
      return json({ data: serializeEntry(row) });
    },

    async PUT(
      request: NextRequest,
      context: { params: Promise<{ id: string }> }
    ) {
      const admin = await requireAdmin();
      if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

      const { id } = await context.params;
      try {
        const body = (await request.json()) as TUpdate;
        const updated = await handlers.update(id, body);
        return json({ data: serializeEntry(updated) });
      } catch (error) {
        return json(
          {
            error: "Update failed",
            details: error instanceof Error ? error.message : String(error),
          },
          { status: 400 }
        );
      }
    },

    async DELETE(
      _request: NextRequest,
      context: { params: Promise<{ id: string }> }
    ) {
      const admin = await requireAdmin();
      if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

      const { id } = await context.params;
      try {
        await handlers.remove(id);
        return json({ ok: true });
      } catch {
        return json({ error: "Delete failed" }, { status: 400 });
      }
    },
  };
}

export function parsePublishedAt(value: unknown, publish?: boolean) {
  if (publish === true) {
    if (typeof value === "string" && value) return new Date(value);
    return new Date();
  }
  if (publish === false || value === null) return null;
  if (typeof value === "string" && value) return new Date(value);
  return undefined;
}

export function createAdminDuplicateHandler(
  duplicate: (id: string) => Promise<{ id: string } | null>
) {
  return async (
    _request: Request,
    context: { params: Promise<{ id: string }> }
  ) => {
    const admin = await requireAdmin();
    if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    try {
      const created = await duplicate(id);
      if (!created) return json({ error: "Not found" }, { status: 404 });
      return json({ data: created }, { status: 201 });
    } catch (error) {
      return json(
        {
          error: "Duplicate failed",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 400 }
      );
    }
  };
}

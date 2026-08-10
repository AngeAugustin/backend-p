import { prisma } from "@/lib/prisma";
import {
  getFilterEq,
  json,
  options,
  parseSort,
  publishedOnly,
} from "@/lib/api";
import { listResponse, serializeEntry } from "@/lib/serialize";

export async function OPTIONS(request: Request) {
  return options(request.headers.get("origin"));
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || "fr";
  const slug = getFilterEq(searchParams, "slug");
  const sort = parseSort(searchParams.get("sort"), {
    field: "order",
    direction: "asc",
  });

  const allowedSort = new Set(["order", "createdAt", "updatedAt", "title"]);
  const field = allowedSort.has(sort.field) ? sort.field : "order";

  const rows = await prisma.service.findMany({
    where: {
      locale,
      ...(slug ? { slug } : {}),
      ...publishedOnly(false),
    },
    orderBy: { [field]: sort.direction },
  });

  return json(listResponse(rows.map(serializeEntry)), { origin });
}

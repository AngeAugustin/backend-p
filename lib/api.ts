import { NextResponse } from "next/server";

export function corsHeaders(origin?: string | null) {
  const allowed = process.env.FRONTEND_URL || "http://localhost:5173";
  const requestOrigin = origin || allowed;
  const allow =
    requestOrigin === allowed ||
    requestOrigin === "http://localhost:5173" ||
    requestOrigin === "http://127.0.0.1:5173" ||
    requestOrigin === "http://localhost:4173";

  return {
    "Access-Control-Allow-Origin": allow ? requestOrigin : allowed,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
    "Access-Control-Allow-Credentials": "true",
  };
}

export function json(
  data: unknown,
  init?: ResponseInit & { origin?: string | null }
) {
  const { origin, ...rest } = init || {};
  return NextResponse.json(data, {
    ...rest,
    headers: {
      ...corsHeaders(origin),
      ...(rest.headers || {}),
    },
  });
}

export function options(origin?: string | null) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export function parseSort(
  sort: string | null,
  fallback: { field: string; direction: "asc" | "desc" }
) {
  if (!sort) return fallback;
  const [field, direction] = sort.split(":");
  if (!field) return fallback;
  return {
    field,
    direction: direction === "asc" ? "asc" : "desc",
  } as const;
}

export function getFilterEq(searchParams: URLSearchParams, field: string) {
  return (
    searchParams.get(`filters[${field}][$eq]`) ||
    searchParams.get(`filters.${field}.$eq`)
  );
}

export function publishedOnly(includeDrafts: boolean) {
  if (includeDrafts) return {};
  return { publishedAt: { not: null } };
}

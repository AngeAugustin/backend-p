import { NextResponse } from "next/server";

const LOCAL_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
];

const PRODUCTION_ORIGINS = [
  "https://augustinfachehoun.pro",
  "https://www.augustinfachehoun.pro",
  "https://augustinfachehoun.vercel.app",
];

function allowedOrigins() {
  const fromEnv = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set([...fromEnv, ...LOCAL_ORIGINS, ...PRODUCTION_ORIGINS])];
}

export function corsHeaders(origin?: string | null) {
  const allowed = allowedOrigins();
  const fallback = allowed[0] || "https://augustinfachehoun.pro";
  const requestOrigin = origin || fallback;
  const allow = allowed.includes(requestOrigin);

  return {
    "Access-Control-Allow-Origin": allow ? requestOrigin : fallback,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
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

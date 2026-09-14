import { getClientIp } from "@/lib/rateLimit";

export type GeoLocation = {
  country: string | null;
  countryCode: string | null;
  city: string | null;
  region: string | null;
};

const PRIVATE_IP =
  /^(::1|localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|fc00:|fe80:)/i;

function decodeHeader(value: string | null) {
  if (!value) return null;
  try {
    return decodeURIComponent(value).trim() || null;
  } catch {
    return value.trim() || null;
  }
}

function countryNameFromCode(code: string | null) {
  if (!code || code.length !== 2) return null;
  try {
    return (
      new Intl.DisplayNames(["fr"], { type: "region" }).of(code.toUpperCase()) ??
      code.toUpperCase()
    );
  } catch {
    return code.toUpperCase();
  }
}

function geoFromHeaders(request: Request): GeoLocation | null {
  const countryCode =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    request.headers.get("cloudfront-viewer-country");

  if (!countryCode || countryCode === "XX" || countryCode === "T1") {
    return null;
  }

  const city =
    decodeHeader(request.headers.get("x-vercel-ip-city")) ||
    decodeHeader(request.headers.get("cf-ipcity")) ||
    null;

  const region =
    decodeHeader(request.headers.get("x-vercel-ip-country-region")) ||
    decodeHeader(request.headers.get("x-vercel-ip-region")) ||
    null;

  return {
    countryCode: countryCode.toUpperCase(),
    country: countryNameFromCode(countryCode),
    city,
    region,
  };
}

async function geoFromIp(ip: string): Promise<GeoLocation | null> {
  if (!ip || ip === "unknown" || PRIVATE_IP.test(ip)) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = (await response.json()) as {
      success?: boolean;
      country?: string;
      country_code?: string;
      city?: string;
      region?: string;
    };

    if (!data.success) return null;

    return {
      country: data.country?.trim() || null,
      countryCode: data.country_code?.toUpperCase() || null,
      city: data.city?.trim() || null,
      region: data.region?.trim() || null,
    };
  } catch {
    return null;
  }
}

export async function resolveGeo(request: Request): Promise<GeoLocation> {
  const fromHeaders = geoFromHeaders(request);
  if (fromHeaders) return fromHeaders;

  const fromIp = await geoFromIp(getClientIp(request));
  return (
    fromIp ?? {
      country: null,
      countryCode: null,
      city: null,
      region: null,
    }
  );
}

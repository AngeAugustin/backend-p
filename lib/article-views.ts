import { createHash } from "crypto";
import { getClientIp } from "@/lib/rateLimit";

export function hashVisitor(request: Request) {
  const ip = getClientIp(request);
  const salt = process.env.AUTH_SECRET || process.env.VIEW_SALT || "portfolio-views";
  return createHash("sha256").update(`${ip}:${salt}`).digest("hex").slice(0, 32);
}

export function todayViewDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export type ArticleViewStats = {
  totalViews: number;
  uniqueVisitors: number;
  countries: { country: string; countryCode: string | null; count: number }[];
  cities: {
    city: string;
    country: string | null;
    countryCode: string | null;
    count: number;
  }[];
  recent: {
    id: string;
    createdAt: string;
    country: string | null;
    countryCode: string | null;
    city: string | null;
    region: string | null;
  }[];
};

export function aggregateArticleViews(
  views: {
    id: string;
    visitorHash: string;
    country: string | null;
    countryCode: string | null;
    city: string | null;
    region: string | null;
    createdAt: Date;
  }[]
): ArticleViewStats {
  const countryMap = new Map<
    string,
    { country: string; countryCode: string | null; count: number }
  >();
  const cityMap = new Map<
    string,
    {
      city: string;
      country: string | null;
      countryCode: string | null;
      count: number;
    }
  >();
  const visitors = new Set<string>();

  for (const view of views) {
    visitors.add(view.visitorHash);

    const countryLabel = view.country || view.countryCode || "Inconnu";
    const countryKey = view.countryCode || countryLabel;
    const existingCountry = countryMap.get(countryKey);
    if (existingCountry) {
      existingCountry.count += 1;
    } else {
      countryMap.set(countryKey, {
        country: countryLabel,
        countryCode: view.countryCode,
        count: 1,
      });
    }

    if (view.city) {
      const cityKey = `${view.city}|${view.countryCode || view.country || ""}`;
      const existingCity = cityMap.get(cityKey);
      if (existingCity) {
        existingCity.count += 1;
      } else {
        cityMap.set(cityKey, {
          city: view.city,
          country: view.country,
          countryCode: view.countryCode,
          count: 1,
        });
      }
    }
  }

  return {
    totalViews: views.length,
    uniqueVisitors: visitors.size,
    countries: [...countryMap.values()].sort((a, b) => b.count - a.count),
    cities: [...cityMap.values()].sort((a, b) => b.count - a.count),
    recent: views
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20)
      .map((view) => ({
        id: view.id,
        createdAt: view.createdAt.toISOString(),
        country: view.country,
        countryCode: view.countryCode,
        city: view.city,
        region: view.region,
      })),
  };
}

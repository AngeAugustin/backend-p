"use client";

import { useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule,
} from "react-simple-maps";

const GEO_URL =
  "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_admin_0_countries.geojson";

type CountryStat = {
  country: string;
  countryCode: string | null;
  count: number;
};

type Tooltip = {
  name: string;
  count: number;
  x: number;
  y: number;
};

function getIsoCode(properties: Record<string, unknown>): string | null {
  const candidates = [
    properties.ISO_A2_EH,
    properties.ISO_A2,
    properties.WB_A2,
    properties["ISO3166-1-Alpha-2"],
  ];

  for (const value of candidates) {
    if (typeof value !== "string") continue;
    const code = value.trim().toUpperCase();
    if (code && code !== "-99" && code.length === 2) return code;
  }

  return null;
}

function getCountryName(properties: Record<string, unknown>, fallback: string) {
  const name =
    properties.NAME_FR ||
    properties.NAME ||
    properties.ADMIN ||
    properties.name;
  return typeof name === "string" && name ? name : fallback;
}

function colorForCount(count: number, max: number, hovered: boolean) {
  if (count <= 0 || max <= 0) return hovered ? "#d5e2dd" : "#e8efec";
  const t = Math.min(1, Math.max(0.18, count / max));
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  const r = mix(143, 16);
  const g = mix(184, 44);
  const b = mix(174, 39);
  if (hovered) return "#0f766e";
  return `rgb(${r}, ${g}, ${b})`;
}

export function ArticleViewsWorldMap({
  countries,
}: {
  countries: CountryStat[];
}) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const { byCode, max } = useMemo(() => {
    const map = new Map<string, CountryStat>();
    let peak = 0;
    for (const entry of countries) {
      if (!entry.countryCode) continue;
      const code = entry.countryCode.toUpperCase();
      map.set(code, entry);
      if (entry.count > peak) peak = entry.count;
    }
    return { byCode: map, max: peak };
  }, [countries]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-[#f4f8f6]">
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 155, center: [10, 8] }}
        width={800}
        height={420}
        className="h-auto w-full"
      >
        <Sphere stroke="#d5e2dd" strokeWidth={0.5} fill="#eef5f2" id="sphere" />
        <Graticule stroke="#d7e4df" strokeWidth={0.4} />
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const properties = geo.properties as Record<string, unknown>;
              const code = getIsoCode(properties);
              const match = code ? byCode.get(code) : undefined;
              const count = match?.count ?? 0;
              const name =
                match?.country || getCountryName(properties, code || "Pays");
              const hovered = hoveredKey === geo.rsmKey;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={colorForCount(count, max, hovered)}
                  stroke="#ffffff"
                  strokeWidth={0.4}
                  style={{ outline: "none", cursor: "pointer" }}
                  onMouseEnter={(event) => {
                    setHoveredKey(geo.rsmKey);
                    setTooltip({
                      name,
                      count,
                      x: event.clientX,
                      y: event.clientY,
                    });
                  }}
                  onMouseMove={(event) => {
                    setTooltip((current) =>
                      current
                        ? { ...current, x: event.clientX, y: event.clientY }
                        : {
                            name,
                            count,
                            x: event.clientX,
                            y: event.clientY,
                          }
                    );
                  }}
                  onMouseLeave={() => {
                    setHoveredKey(null);
                    setTooltip(null);
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {tooltip ? (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          <p className="font-medium text-foreground">{tooltip.name}</p>
          <p className="mt-0.5 text-muted-foreground">
            {tooltip.count} vue{tooltip.count === 1 ? "" : "s"}
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4 border-t border-border/70 px-4 py-3 text-xs text-muted-foreground">
        <span>Provenance des vues</span>
        <div className="flex items-center gap-2">
          <span>Faible</span>
          <div
            className="h-2 w-28 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, #e8efec 0%, #8fb8ae 45%, #102c27 100%)",
            }}
          />
          <span>Élevé</span>
        </div>
      </div>
    </div>
  );
}

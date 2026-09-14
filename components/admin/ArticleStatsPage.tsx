"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, Globe2, MapPin, Users } from "lucide-react";
import { adminFetch } from "@/lib/admin-client";
import { PageHeader } from "@/components/admin/PageHeader";
import { ArticleViewsWorldMap } from "@/components/admin/ArticleViewsWorldMap";

type ArticleStatsPayload = {
  article: {
    id: string;
    title: string;
    slug: string;
    locale: string;
  };
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

function formatPlace(parts: (string | null | undefined)[]) {
  return parts.filter(Boolean).join(" · ") || "Lieu inconnu";
}

export function ArticleStatsPage({ articleId }: { articleId: string }) {
  const [stats, setStats] = useState<ArticleStatsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    adminFetch<{ data: ArticleStatsPayload }>(
      `/api/admin/articles/${articleId}/stats`
    )
      .then((response) => {
        if (cancelled) return;
        setStats(response.data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Impossible de charger les stats"
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [articleId]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Statistiques" description="Chargement…" />
        <div className="h-72 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div>
        <PageHeader
          title="Statistiques"
          actions={
            <Link
              href={`/admin/articles/${articleId}`}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium transition hover:bg-accent"
            >
              <ArrowLeft className="size-4" />
              Retour
            </Link>
          }
        />
        <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error || "Statistiques introuvables"}
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Statistiques"
        description={`${stats.article.title} · /${stats.article.locale}/${stats.article.slug}`}
        actions={
          <Link
            href={`/admin/articles/${articleId}`}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium transition hover:bg-accent"
          >
            <ArrowLeft className="size-4" />
            Retour à l’article
          </Link>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Eye className="size-4" />
            <span className="text-xs font-medium uppercase tracking-[0.14em]">
              Vues
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {stats.totalViews}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="size-4" />
            <span className="text-xs font-medium uppercase tracking-[0.14em]">
              Visiteurs uniques
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {stats.uniqueVisitors}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe2 className="size-4" />
            <span className="text-xs font-medium uppercase tracking-[0.14em]">
              Pays
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {stats.countries.filter((c) => c.countryCode).length}
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Carte des provenances
          </h2>
          <ArticleViewsWorldMap countries={stats.countries} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe2 className="size-4" />
            <h2 className="text-xs font-medium uppercase tracking-[0.14em]">
              Top pays
            </h2>
          </div>
          {stats.countries.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Aucune vue géolocalisée pour le moment.
            </p>
          ) : (
            <ul className="mt-4 max-h-[26rem] space-y-2 overflow-y-auto pr-1">
              {stats.countries.map((entry) => (
                <li
                  key={`${entry.countryCode ?? entry.country}`}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="font-medium text-foreground">
                    {entry.country}
                    {entry.countryCode ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {entry.countryCode}
                      </span>
                    ) : null}
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {entry.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4" />
            <h2 className="text-xs font-medium uppercase tracking-[0.14em]">
              Villes
            </h2>
          </div>
          {stats.cities.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Aucune donnée.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {stats.cities.map((entry) => (
                <li
                  key={`${entry.city}-${entry.countryCode ?? entry.country ?? ""}`}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span>
                    <span className="font-medium text-foreground">
                      {entry.city}
                    </span>
                    {entry.country ? (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {entry.country}
                      </span>
                    ) : null}
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {entry.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Vues récentes
          </h2>
          {stats.recent.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Aucune vue enregistrée.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border/70">
              {stats.recent.map((view) => (
                <li
                  key={view.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <span className="font-medium text-foreground">
                    {formatPlace([view.city, view.region, view.country])}
                  </span>
                  <time className="text-xs text-muted-foreground">
                    {new Date(view.createdAt).toLocaleString("fr-FR")}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

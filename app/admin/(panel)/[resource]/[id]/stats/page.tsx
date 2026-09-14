import { notFound } from "next/navigation";
import { ArticleStatsPage } from "@/components/admin/ArticleStatsPage";
import { getResource } from "@/lib/admin-resources";
import { loadAdminRow } from "@/lib/admin-data";

export default async function ResourceStatsPage({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  const { resource: key, id } = await params;
  const resource = getResource(key);
  if (!resource || key !== "articles") notFound();

  const row = await loadAdminRow(key, id);
  if (!row) notFound();

  return <ArticleStatsPage articleId={id} />;
}

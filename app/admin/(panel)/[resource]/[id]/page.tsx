import { notFound } from "next/navigation";
import { ResourceDetail } from "@/components/admin/ResourceDetail";
import { loadAdminRow, serializeAdminRow } from "@/lib/admin-data";
import { getResource } from "@/lib/admin-resources";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  const { resource: key, id } = await params;
  const resource = getResource(key);
  if (!resource) notFound();

  const row = await loadAdminRow(key, id);
  if (!row) notFound();

  return (
    <ResourceDetail
      resource={resource}
      id={id}
      data={serializeAdminRow(row as unknown as Record<string, unknown>)}
    />
  );
}

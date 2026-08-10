import { notFound } from "next/navigation";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { loadAdminRow, serializeAdminRow } from "@/lib/admin-data";
import { getResource } from "@/lib/admin-resources";

export default async function EditResourcePage({
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
    <ResourceForm
      resource={resource}
      id={id}
      initial={serializeAdminRow(row as unknown as Record<string, unknown>)}
    />
  );
}

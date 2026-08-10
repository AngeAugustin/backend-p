import { notFound } from "next/navigation";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { getResource } from "@/lib/admin-resources";

export default async function NewResourcePage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource: key } = await params;
  const resource = getResource(key);
  if (!resource) notFound();
  return <ResourceForm resource={resource} />;
}

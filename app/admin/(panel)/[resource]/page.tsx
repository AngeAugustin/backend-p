import { notFound } from "next/navigation";
import { ResourceList } from "@/components/admin/ResourceList";
import { getResource } from "@/lib/admin-resources";

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource: key } = await params;
  const resource = getResource(key);
  if (!resource) notFound();
  return <ResourceList resource={resource} />;
}

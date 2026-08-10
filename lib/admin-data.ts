import { prisma } from "@/lib/prisma";

export async function loadAdminRow(key: string, id: string) {
  switch (key) {
    case "projects":
      return prisma.project.findUnique({ where: { id } });
    case "articles":
      return prisma.article.findUnique({ where: { id } });
    case "services":
      return prisma.service.findUnique({ where: { id } });
    case "experiences":
      return prisma.experience.findUnique({ where: { id } });
    case "testimonials":
      return prisma.testimonial.findUnique({ where: { id } });
    case "educations":
      return prisma.education.findUnique({ where: { id } });
    default:
      return null;
  }
}

export function serializeAdminRow(
  row: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Date) {
      out[key] = value.toISOString();
    } else {
      out[key] = value;
    }
  }
  return out;
}

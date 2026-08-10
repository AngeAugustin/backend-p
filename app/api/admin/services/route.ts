import { prisma } from "@/lib/prisma";
import {
  createAdminCollectionHandlers,
  parsePublishedAt,
} from "@/lib/admin-crud";

type Body = {
  locale?: string;
  slug: string;
  title: string;
  summary: string;
  tagline?: string | null;
  overview?: string | null;
  order?: number;
  tags?: string | null;
  deliverables?: string | null;
  approach?: string | null;
  stack?: string | null;
  idealFor?: string | null;
  publishedAt?: string | null;
  publish?: boolean;
};

const handlers = createAdminCollectionHandlers<Body>({
  list: (locale) =>
    prisma.service.findMany({
      where: locale ? { locale } : undefined,
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    }),
  create: (data) =>
    prisma.service.create({
      data: {
        locale: data.locale || "fr",
        slug: data.slug,
        title: data.title,
        summary: data.summary,
        tagline: data.tagline ?? null,
        overview: data.overview ?? null,
        order: data.order ?? 0,
        tags: data.tags ?? null,
        deliverables: data.deliverables ?? null,
        approach: data.approach ?? null,
        stack: data.stack ?? null,
        idealFor: data.idealFor ?? null,
        publishedAt: parsePublishedAt(data.publishedAt, data.publish) ?? new Date(),
      },
    }),
});

export const GET = handlers.GET;
export const POST = handlers.POST;

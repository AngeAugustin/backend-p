import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { json, options } from "@/lib/api";
import { resolveGeo } from "@/lib/geo";
import { hashVisitor, todayViewDate } from "@/lib/article-views";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const viewSchema = z.object({
  data: z.object({
    slug: z.string().trim().min(1),
    locale: z.string().trim().min(2).max(8).optional(),
  }),
});

export async function OPTIONS(request: Request) {
  return options(request.headers.get("origin"));
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  try {
    const rateLimit = checkRateLimit(`article-view:${getClientIp(request)}`);
    if (!rateLimit.allowed) {
      return json(
        { error: "Too many requests" },
        { status: 429, origin }
      );
    }

    const body = await request.json();
    const parsed = viewSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400, origin }
      );
    }

    const slug = parsed.data.data.slug;
    const locale = parsed.data.data.locale || "fr";

    const article = await prisma.article.findFirst({
      where: {
        slug,
        locale,
        publishedAt: { not: null },
      },
      select: { id: true },
    });

    if (!article) {
      return json({ error: "Article not found" }, { status: 404, origin });
    }

    const visitorHash = hashVisitor(request);
    const viewDate = todayViewDate();
    const geo = await resolveGeo(request);

    try {
      const created = await prisma.articleView.create({
        data: {
          articleId: article.id,
          visitorHash,
          viewDate,
          country: geo.country,
          countryCode: geo.countryCode,
          city: geo.city,
          region: geo.region,
        },
        select: { id: true },
      });

      return json(
        { data: { id: created.id, counted: true } },
        { status: 201, origin }
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return json(
          { data: { counted: false } },
          { status: 200, origin }
        );
      }
      throw error;
    }
  } catch {
    return json({ error: "Unable to record article view" }, { status: 500, origin });
  }
}

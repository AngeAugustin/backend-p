import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { json, options } from "@/lib/api";

const contactSchema = z.object({
  data: z.object({
    name: z.string().trim().min(1),
    email: z.string().trim().email(),
    message: z.string().trim().min(1),
    locale: z.string().optional(),
    status: z.enum(["new", "read", "archived"]).optional(),
  }),
});

export async function OPTIONS(request: Request) {
  return options(request.headers.get("origin"));
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400, origin }
      );
    }

    const { name, email, message, locale, status } = parsed.data.data;
    const created = await prisma.contactMessage.create({
      data: {
        name,
        email,
        message,
        locale: locale || "fr",
        status: status || "new",
      },
    });

    return json(
      {
        data: {
          ...created,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        },
      },
      { status: 201, origin }
    );
  } catch {
    return json({ error: "Unable to create contact message" }, { status: 500, origin });
  }
}

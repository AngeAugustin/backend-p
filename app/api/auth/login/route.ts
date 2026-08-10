import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { json } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return json({ error: "Invalid credentials payload" }, { status: 400 });
    }

    const user = await prisma.adminUser.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (!user) {
      return json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await createSessionToken({
      sub: user.id,
      email: user.email,
    });
    await setSessionCookie(token);

    return json({
      data: { id: user.id, email: user.email, name: user.name },
    });
  } catch {
    return json({ error: "Login failed" }, { status: 500 });
  }
}

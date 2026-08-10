import { getSession } from "@/lib/auth";
import { json } from "@/lib/api";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  return json({ data: user });
}

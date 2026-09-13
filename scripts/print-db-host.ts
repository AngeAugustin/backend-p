function redact(value?: string) {
  if (!value) return "(missing)";
  if (value.includes("[SENSITIVE]")) return "(placeholder [SENSITIVE])";
  return value.replace(/:[^:@/]+@/, ":****@");
}

console.log("DATABASE_URL host:", redact(process.env.DATABASE_URL));

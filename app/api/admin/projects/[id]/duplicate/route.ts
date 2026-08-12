import { createAdminDuplicateHandler } from "@/lib/admin-crud";
import { duplicateProject } from "@/lib/admin-duplicate";

export const POST = createAdminDuplicateHandler(duplicateProject);

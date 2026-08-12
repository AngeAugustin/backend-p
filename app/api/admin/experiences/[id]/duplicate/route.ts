import { createAdminDuplicateHandler } from "@/lib/admin-crud";
import { duplicateExperience } from "@/lib/admin-duplicate";

export const POST = createAdminDuplicateHandler(duplicateExperience);

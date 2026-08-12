import { createAdminDuplicateHandler } from "@/lib/admin-crud";
import { duplicateEducation } from "@/lib/admin-duplicate";

export const POST = createAdminDuplicateHandler(duplicateEducation);

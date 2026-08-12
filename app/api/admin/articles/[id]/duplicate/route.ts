import { createAdminDuplicateHandler } from "@/lib/admin-crud";
import { duplicateArticle } from "@/lib/admin-duplicate";

export const POST = createAdminDuplicateHandler(duplicateArticle);

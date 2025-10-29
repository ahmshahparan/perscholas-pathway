import { TRPCError } from "@trpc/server";
import { getAdminByUsername } from "./db";

/**
 * Check if a user can modify an entity
 * Returns true if:
 * - User has global_admin role (has full access), OR
 * - User is the creator of the entity
 */
export async function canModifyEntity(username: string, entityCreator: string): Promise<boolean> {
  // Check if user has global_admin role
  const admin = await getAdminByUsername(username);
  if (admin && admin.role === "global_admin") {
    return true;
  }
  
  // Otherwise check if user is the creator
  return username === entityCreator;
}

/**
 * Assert that a user can modify an entity, throw error if not
 */
export async function assertCanModify(username: string, entityCreator: string, entityType: string, entityName: string): Promise<void> {
  const canModify = await canModifyEntity(username, entityCreator);
  if (!canModify) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `You do not have permission to modify this ${entityType}. Only the creator (${entityCreator}) or global admins can modify "${entityName}".`,
    });
  }
}


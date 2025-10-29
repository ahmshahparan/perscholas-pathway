/**
 * Authorization helper hook for checking if current admin can modify entities
 */
export function useAuthorization(currentUsername: string | undefined, currentRole?: string | null) {
  const canModify = (entityCreator: string) => {
    if (!currentUsername) return false;
    // Global admins can modify anything
    if (currentRole === "global_admin") return true;
    // Otherwise, only the creator can modify
    return currentUsername === entityCreator;
  };

  const isGlobalAdmin = currentRole === "global_admin";

  return {
    canModify,
    isGlobalAdmin,
  };
}


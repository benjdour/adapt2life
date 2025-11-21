const parseIdList = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const adminUserIds = parseIdList(process.env.ADMIN_MENU_USER_IDS ?? process.env.DEBUG_GENERATOR_USER_IDS);

export const ADMIN_MENU_USER_IDS = new Set(adminUserIds);

export const canAccessAdminArea = (userId?: string | null): boolean => {
  if (!userId) return false;
  return ADMIN_MENU_USER_IDS.has(userId);
};

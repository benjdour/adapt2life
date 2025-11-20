const parseIdList = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const debugUserIds = parseIdList(process.env.DEBUG_GENERATOR_USER_IDS);

export const DEBUG_GENERATOR_USER_IDS = new Set(debugUserIds);
export const ADMIN_MENU_USER_IDS = new Set(debugUserIds);

export const canAccessDebugGenerator = (userId?: string | null): boolean => {
  if (!userId) return false;
  return DEBUG_GENERATOR_USER_IDS.has(userId);
};

export const canAccessAdminArea = (userId?: string | null): boolean => {
  if (!userId) return false;
  return ADMIN_MENU_USER_IDS.has(userId);
};

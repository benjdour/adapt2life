const parseIdList = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

export const DEBUG_GENERATOR_USER_IDS = new Set(parseIdList(process.env.DEBUG_GENERATOR_USER_IDS));
export const ADMIN_MENU_USER_IDS = new Set(parseIdList(process.env.ADMIN_MENU_USER_IDS));

export const canAccessDebugGenerator = (userId?: string | null): boolean => {
  if (!userId) return false;
  return DEBUG_GENERATOR_USER_IDS.has(userId);
};

export const canAccessAdminArea = (userId?: string | null): boolean => {
  if (!userId) return false;
  return ADMIN_MENU_USER_IDS.has(userId);
};

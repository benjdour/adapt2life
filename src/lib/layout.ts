import { getCommonCopy } from "@/i18n/common";
import type { Locale } from "@/i18n/config";
import { getSession } from "./session";

export async function getLayoutCopy(locale: Locale) {
  const session = await getSession();
  const common = getCommonCopy(locale);
  const isAuthenticated = Boolean(session?.userId);

  const navCta = isAuthenticated
    ? { slug: "logout", label: common.navLogoutLabel }
    : common.navCta;

  return {
    session,
    common,
    navCta,
    isAuthenticated,
  };
}

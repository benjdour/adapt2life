import { getCommonCopy } from "@/i18n/common";
import type { Locale } from "@/i18n/config";
import { getSession, setSession } from "./session";

export async function getLayoutCopy(locale: Locale) {
  const session = await getSession();
  let effectiveSession = session;

  if (session?.userId) {
    const desiredLocale = locale;
    const storedLocale = session.locale;

    if (storedLocale !== desiredLocale) {
      effectiveSession = await setSession({
        ...session,
        locale: desiredLocale,
      });
    }
  }

  const common = getCommonCopy(locale);
  const isAuthenticated = Boolean(effectiveSession?.userId);

  const navCta = isAuthenticated
    ? { slug: "logout", label: common.navLogoutLabel }
    : common.navCta;

  return {
    session: effectiveSession,
    common,
    navCta,
    isAuthenticated,
  };
}

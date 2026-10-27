import { defineRouting } from "next-intl/routing";

export const LOCALES = ["en", "km"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: "en",
  // Every page lives under /en or /km so hreflang alternates are explicit.
  localePrefix: "always",
  localeCookie: { name: LOCALE_COOKIE, maxAge: 60 * 60 * 24 * 365 },
});

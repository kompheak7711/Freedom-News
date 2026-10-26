import type { Metadata } from "next";
import { LOCALES, type Locale } from "@/i18n/routing";

export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

interface PageMeta {
  locale: Locale | string;
  /** Path without the locale prefix, e.g. "/blindspot". */
  path: string;
  title: string;
  description: string;
  image?: string;
}

/** Per-locale title and description plus hreflang alternates for every locale. */
export function pageMetadata({ locale, path, title, description, image }: PageMeta): Metadata {
  const clean = path === "/" ? "" : path;
  const languages = Object.fromEntries(LOCALES.map((l) => [l, `/${l}${clean}`]));
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}${clean}`,
      languages: { ...languages, "x-default": `/en${clean}` },
    },
    openGraph: {
      title,
      description,
      locale: locale === "km" ? "km_KH" : "en_US",
      type: "website",
      ...(image ? { images: [image] } : {}),
    },
  };
}

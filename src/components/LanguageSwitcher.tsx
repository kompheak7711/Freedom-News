"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALES, LOCALE_COOKIE, type Locale } from "@/i18n/routing";

/** EN / ខ្មែរ toggle. Remembers the choice in the locale cookie and reloads the same page. */
export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("lang");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    const query = Object.fromEntries(searchParams.entries());
    startTransition(() => {
      router.replace({ pathname, query }, { locale: next });
    });
  }

  return (
    <div className="inline-flex rounded-lg border border-line bg-card p-0.5" role="group" aria-label={t("current", { language: t(locale as Locale) })}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          disabled={pending}
          lang={l}
          aria-pressed={l === locale}
          title={t("switchTo", { language: t(l) })}
          className={`rounded-md px-2.5 py-1 text-sm font-semibold transition ${
            l === locale ? "bg-ink text-bg" : "text-muted hover:text-ink"
          }`}
        >
          {l === "en" ? "EN" : "ខ្មែរ"}
        </button>
      ))}
    </div>
  );
}

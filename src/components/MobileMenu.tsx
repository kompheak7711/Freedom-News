"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { CATEGORIES } from "@/lib/types";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NavLinks } from "./NavLinks";

export function MobileMenu() {
  const t = useTranslations();
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="btn px-2"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? t("nav.closeMenu") : t("nav.menu")}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-14 bottom-0 z-50 overflow-y-auto border-t border-line bg-card p-4">
          <form action={`/${locale}/search`} method="get" role="search" className="mb-4 flex gap-2" onSubmit={() => setOpen(false)}>
            <input
              name="q"
              type="search"
              placeholder={t("nav.searchPlaceholder")}
              aria-label={t("nav.search")}
              className="h-11 flex-1 rounded-lg border border-line bg-bg px-3 text-base"
            />
            <button type="submit" className="btn btn-primary">
              {t("nav.search")}
            </button>
          </form>
          <NavLinks vertical onNavigate={() => setOpen(false)} />
          <h2 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("footer.sections")}</h2>
          <ul className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <Link href={`/category/${c}`} className="chip" onClick={() => setOpen(false)}>
                  {t(`categories.${c}`)}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-5 space-y-1 border-t border-line pt-4 text-sm">
            <li>
              <Link href="/sources" className="block py-1 font-semibold" onClick={() => setOpen(false)}>
                {t("nav.sources")}
              </Link>
            </li>
          </ul>
          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("nav.language")}</p>
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </div>
  );
}

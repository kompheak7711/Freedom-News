"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { CATEGORIES } from "@/lib/types";

/** The horizontally scrollable section bar under the top navigation. */
export function CategoryBar() {
  const t = useTranslations("categories");
  const pathname = usePathname();
  return (
    <div className="border-t border-line">
      <nav className="container-page scroll-x py-2" aria-label={t("all")}>
        <Link href="/" className="chip" data-active={pathname === "/"}>
          {t("all")}
        </Link>
        {CATEGORIES.map((c) => (
          <Link key={c} href={`/category/${c}`} className="chip" data-active={pathname === `/category/${c}`}>
            {t(c)}
          </Link>
        ))}
      </nav>
    </div>
  );
}

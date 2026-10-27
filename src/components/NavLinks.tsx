"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const ITEMS = [
  { href: "/", key: "home" },
  { href: "/for-you", key: "forYou" },
  { href: "/local", key: "local" },
  { href: "/blindspot", key: "blindspot" },
] as const;

export function NavLinks({ vertical = false, onNavigate }: { vertical?: boolean; onNavigate?: () => void }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  return (
    <ul className={vertical ? "flex flex-col gap-1" : "flex items-center gap-1"}>
      {ITEMS.map(({ href, key }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <li key={key}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`block rounded-md px-3 py-2 text-sm font-semibold transition ${
                active ? "bg-soft text-ink" : "text-muted hover:bg-soft hover:text-ink"
              } ${vertical ? "text-base" : ""}`}
            >
              {t(key)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

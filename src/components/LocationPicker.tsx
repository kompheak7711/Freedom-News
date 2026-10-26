"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { COOKIE_MAX_AGE, LOCATION_COOKIE } from "@/lib/prefs";
import { LOCATIONS, type Location } from "@/lib/regions";

/** Country picker for the Local page. Stores the choice in a cookie and re-renders the page. */
export function LocationPicker({ current }: { current: Location | null }) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(location: Location) {
    document.cookie = `${LOCATION_COOKIE}=${location}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t("local.setLocation")}>
      {LOCATIONS.map((l) => (
        <button key={l} type="button" className="chip" data-active={current === l} aria-pressed={current === l} disabled={pending} onClick={() => choose(l)}>
          {t(`locations.${l}`)}
        </button>
      ))}
    </div>
  );
}

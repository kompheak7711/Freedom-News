"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { COOKIE_MAX_AGE, PREFS_COOKIE, serializePrefs, type Prefs } from "@/lib/prefs";
import { CATEGORIES, type Category } from "@/lib/types";

export interface OutletOption {
  id: string;
  name: string;
}

/** Follow / unfollow chips for topics and outlets. Saved in a cookie, so the server can personalise. */
export function FollowEditor({ initial, outlets }: { initial: Prefs; outlets: OutletOption[] }) {
  const t = useTranslations("forYou");
  const tc = useTranslations("categories");
  const router = useRouter();
  const [prefs, setPrefs] = useState<Prefs>(initial);
  const [pending, startTransition] = useTransition();

  function save(next: Prefs) {
    setPrefs(next);
    document.cookie = `${PREFS_COOKIE}=${serializePrefs(next)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
    startTransition(() => router.refresh());
  }

  function toggleTopic(topic: Category) {
    const topics = prefs.topics.includes(topic) ? prefs.topics.filter((x) => x !== topic) : [...prefs.topics, topic];
    save({ ...prefs, topics });
  }

  function toggleOutlet(id: string) {
    const list = prefs.outlets.includes(id) ? prefs.outlets.filter((x) => x !== id) : [...prefs.outlets, id];
    save({ ...prefs, outlets: list });
  }

  return (
    <div className="card p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">{t("followingCount", { topics: prefs.topics.length, outlets: prefs.outlets.length })}</p>
        {(prefs.topics.length > 0 || prefs.outlets.length > 0) && (
          <button type="button" className="text-sm font-semibold text-accent hover:underline" onClick={() => save({ topics: [], outlets: [] })} disabled={pending}>
            {t("clear")}
          </button>
        )}
      </div>
      <h2 className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("topics")}</h2>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const on = prefs.topics.includes(c);
          return (
            <button key={c} type="button" className="chip" data-active={on} aria-pressed={on} onClick={() => toggleTopic(c)} disabled={pending}>
              {on ? "✓ " : "+ "}
              {tc(c)}
            </button>
          );
        })}
      </div>
      <h2 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("outlets")}</h2>
      <div className="flex flex-wrap gap-2">
        {outlets.map((o) => {
          const on = prefs.outlets.includes(o.id);
          return (
            <button key={o.id} type="button" className="chip" data-active={on} aria-pressed={on} onClick={() => toggleOutlet(o.id)} disabled={pending}>
              {on ? "✓ " : "+ "}
              {o.name}
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted">{t("savedLocally")}</p>
    </div>
  );
}

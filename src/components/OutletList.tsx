"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Bias, Side } from "@/lib/types";
import { OutletAvatar } from "./bits";

export interface OutletListItem {
  id: string;
  outlet: string;
  bias: Bias;
  side: Side | null;
  title: string;
  url: string;
  timeLabel: string;
  lang?: "km";
}

type Filter = "all" | Side | "unrated";

/** The article list on a story page, filterable by the outlet's side. */
export function OutletList({ items }: { items: OutletListItem[] }) {
  const t = useTranslations();
  const [filter, setFilter] = useState<Filter>("all");
  const count = (f: Filter) => (f === "all" ? items.length : items.filter((i) => (f === "unrated" ? i.side === null : i.side === f)).length);
  const filters: Filter[] = ["all", "left", "center", "right", "unrated"];
  const shown = items.filter((i) => filter === "all" || (filter === "unrated" ? i.side === null : i.side === filter));
  const color = (bias: Bias, side: Side | null) => (side ? `var(--${side})` : "var(--muted)");

  return (
    <section>
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
        <h2 className="mr-2 text-lg font-bold">{t("story.articlesHeading", { count: items.length })}</h2>
        {filters.map((f) =>
          f === "all" || count(f) > 0 ? (
            <button
              key={f}
              type="button"
              className="chip"
              data-active={filter === f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
            >
              {f === "all" ? t("story.filterAll") : t(`bias.${f}`)}
              <span className="text-muted">{count(f)}</span>
            </button>
          ) : null,
        )}
      </div>
      <ul>
        {shown.map((item) => (
          <li key={item.id} className="flex gap-3 border-b border-line py-3 last:border-b-0">
            <OutletAvatar name={item.outlet} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="font-medium text-ink">{item.outlet}</span>
                <span className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: color(item.bias, item.side) }}>
                  {t(`bias.${item.bias}`)}
                </span>
                <span>{item.timeLabel}</span>
              </div>
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-1 block font-semibold hover:underline" lang={item.lang}>
                {item.title}
              </a>
              <p className="mt-1 text-xs text-muted">{t("story.readAt", { outlet: item.outlet })} ↗</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

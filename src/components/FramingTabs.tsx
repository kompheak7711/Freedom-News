"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { LocalizedSummary } from "@/lib/text";

type Tab = "summary" | "left" | "center" | "right";

/** The Ground News-style Summary / Left / Center / Right tabs on a story page. */
export function FramingTabs({ text, generated }: { text: LocalizedSummary; generated: boolean }) {
  const t = useTranslations("story");
  const [tab, setTab] = useState<Tab>("summary");
  const tabs: Array<{ id: Tab; label: string; color?: string }> = [
    { id: "summary", label: t("tabSummary") },
    { id: "left", label: t("tabLeft"), color: "var(--left)" },
    { id: "center", label: t("tabCenter"), color: "var(--center)" },
    { id: "right", label: t("tabRight"), color: "var(--right)" },
  ];
  const lang = text.lang;

  let body: React.ReactNode;
  if (tab === "summary") {
    body = (
      <>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("neutralLabel")}</p>
        <p className="mt-2 text-base leading-relaxed md:text-lg" lang={lang}>
          {text.summary}
        </p>
      </>
    );
  } else if (tab === "center") {
    body = (
      <>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("centerLabel")}</p>
        <p className="mt-2 text-sm text-muted">{t("centerText")}</p>
        <p className="mt-3 text-base leading-relaxed" lang={lang}>
          {text.summary}
        </p>
      </>
    );
  } else {
    const framing = tab === "left" ? text.leftFraming : text.rightFraming;
    body = (
      <>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{tab === "left" ? t("leftLabel") : t("rightLabel")}</p>
        {framing ? (
          <p className="mt-2 text-base leading-relaxed md:text-lg" lang={lang}>
            {framing}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">{generated ? (tab === "left" ? t("noLeft") : t("noRight")) : t("noFraming")}</p>
        )}
      </>
    );
  }

  return (
    <section className="card overflow-hidden">
      <div className="flex border-b border-line" role="tablist" aria-label={t("biasComparison")}>
        {tabs.map(({ id, label, color }) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex-1 border-b-4 px-2 py-2.5 text-sm font-semibold transition ${tab === id ? "text-ink" : "text-muted hover:text-ink"}`}
            style={{ borderBottomColor: tab === id ? (color ?? "var(--foreground)") : "transparent" }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="p-5" role="tabpanel">
        {body}
      </div>
    </section>
  );
}

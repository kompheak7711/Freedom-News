import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { sideOf } from "@/lib/sources";
import type { Bias, Category, Side } from "@/lib/types";

export async function BlindspotBadge({ side, small = false }: { side: Side; small?: boolean }) {
  const t = await getTranslations("blindspot");
  const color = side === "right" ? "var(--right)" : "var(--left)";
  return (
    <span
      className={`chip ${small ? "text-[11px]" : "text-xs"} font-semibold uppercase tracking-wide text-white`}
      style={{ background: color, borderColor: color }}
      title={side === "left" ? t("leftDesc") : t("rightDesc")}
    >
      {t("badge", { side: await sideName(side) })}
    </span>
  );
}

async function sideName(side: Side): Promise<string> {
  const t = await getTranslations("bias");
  return t(side);
}

/** Relative time such as "2 hours ago", formatted for the current locale. */
export async function TimeAgo({ iso, className = "" }: { iso: string; className?: string }) {
  const format = await getFormatter();
  const t = await getTranslations("time");
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const text = diff < 60_000 ? t("justNow") : format.relativeTime(date, { now: new Date(), style: "long" });
  return (
    <time dateTime={iso} className={className} title={format.dateTime(date, { dateStyle: "medium", timeStyle: "short" })}>
      {text}
    </time>
  );
}

export async function CategoryTag({ category, small = false }: { category: Category; small?: boolean }) {
  const t = await getTranslations("categories");
  return (
    <Link href={`/category/${category}`} className={`chip ${small ? "text-[11px]" : "text-xs"} font-semibold uppercase tracking-wide`}>
      {t(category)}
    </Link>
  );
}

export async function BiasLabel({ bias, compact = false }: { bias: Bias; compact?: boolean }) {
  const t = await getTranslations("bias");
  const side = sideOf(bias);
  const color = side ? `var(--${side})` : "var(--muted)";
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 ${compact ? "text-[11px]" : "text-xs"} font-semibold text-white`}
      style={{ background: color }}
    >
      {t(bias)}
    </span>
  );
}

export function OutletAvatar({ name, size = 28 }: { name: string; size?: number }) {
  const initials = name
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || name.slice(0, 1);
  let hue = 0;
  for (const ch of name) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4, background: `hsl(${hue} 35% 45%)` }}
    >
      {initials}
    </span>
  );
}

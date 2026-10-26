import type { Side } from "@/lib/types";

export function BlindspotBadge({ side }: { side: Side }) {
  const color = side === "right" ? "var(--right)" : "var(--left)";
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white"
      style={{ background: color }}
      title={`Few or no ${side}-leaning outlets covered this story`}
    >
      Blindspot for the {side}
    </span>
  );
}

export function TimeAgo({ iso }: { iso: string }) {
  const minutes = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  const text =
    minutes < 60 ? `${minutes}m ago` : minutes < 48 * 60 ? `${Math.round(minutes / 60)}h ago` : `${Math.round(minutes / 1440)}d ago`;
  return <time dateTime={iso}>{text}</time>;
}

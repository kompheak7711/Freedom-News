import { getTranslations } from "next-intl/server";
import { percentages } from "@/lib/coverage";
import type { Coverage, Side } from "@/lib/types";

const SEGMENTS: Array<{ side: Side; className: string }> = [
  { side: "left", className: "bg-left" },
  { side: "center", className: "bg-center" },
  { side: "right", className: "bg-right" },
];

/**
 * The left/center/right bar with percentages. Unrated outlets are not in the
 * bar; `showUnrated` adds a "+n not rated" note under it.
 */
export async function CoverageBar({
  coverage,
  size = "sm",
  showLegend = false,
  showUnrated = true,
}: {
  coverage: Coverage;
  size?: "sm" | "md" | "lg";
  showLegend?: boolean;
  showUnrated?: boolean;
}) {
  const t = await getTranslations();
  const pct = percentages(coverage);
  const short: Record<Side, string> = { left: t("bias.shortLeft"), center: t("bias.shortCenter"), right: t("bias.shortRight") };
  const height = size === "lg" ? "h-7 text-xs" : size === "md" ? "h-6 text-[11px]" : "h-5 text-[10px]";
  const unrated = coverage.unrated ?? 0;
  return (
    <div>
      {coverage.total > 0 ? (
        <div
          className={`flex w-full overflow-hidden rounded ${height} font-bold text-white`}
          role="img"
          aria-label={t("coverage.aria", { left: pct.left, center: pct.center, right: pct.right })}
        >
          {SEGMENTS.map(({ side, className }) =>
            pct[side] > 0 ? (
              <div
                key={side}
                className={`${className} flex items-center justify-center whitespace-nowrap px-1`}
                style={{ width: `${pct[side]}%` }}
              >
                {pct[side] >= 14 ? `${short[side]} ${pct[side]}%` : pct[side] >= 7 ? `${pct[side]}%` : ""}
              </div>
            ) : null,
          )}
        </div>
      ) : (
        <div className={`flex w-full items-center rounded border border-dashed border-line px-2 ${height} text-muted`}>
          {t("coverage.noRated")}
        </div>
      )}
      {(showLegend || (showUnrated && unrated > 0)) && (
        <p className="mt-1 text-xs text-muted">
          {showLegend && t("coverage.breakdown", { left: coverage.left, center: coverage.center, right: coverage.right })}
          {showLegend && showUnrated && unrated > 0 && " · "}
          {showUnrated && unrated > 0 && t("coverage.unrated", { count: unrated })}
        </p>
      )}
    </div>
  );
}

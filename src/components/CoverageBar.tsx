import { percentages } from "@/lib/coverage";
import type { Coverage } from "@/lib/types";

const SEGMENTS = [
  { side: "left", label: "L", className: "bg-[var(--left)]" },
  { side: "center", label: "C", className: "bg-[var(--center)]" },
  { side: "right", label: "R", className: "bg-[var(--right)]" },
] as const;

export function CoverageBar({ coverage, large = false }: { coverage: Coverage; large?: boolean }) {
  const pct = percentages(coverage);
  return (
    <div>
      <div
        className={`flex w-full overflow-hidden rounded ${large ? "h-7" : "h-5"} text-[11px] font-semibold text-white`}
        role="img"
        aria-label={`Coverage: ${pct.left}% left, ${pct.center}% center, ${pct.right}% right`}
      >
        {SEGMENTS.map(({ side, label, className }) =>
          pct[side] > 0 ? (
            <div
              key={side}
              className={`${className} flex items-center justify-center whitespace-nowrap px-1`}
              style={{ width: `${pct[side]}%` }}
            >
              {pct[side] >= 12 ? `${label} ${pct[side]}%` : ""}
            </div>
          ) : null,
        )}
      </div>
      <p className="mt-1 text-xs text-[var(--muted)]">
        {coverage.total} sources · {coverage.left} left · {coverage.center} center · {coverage.right} right
      </p>
    </div>
  );
}

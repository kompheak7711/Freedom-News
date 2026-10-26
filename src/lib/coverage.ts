import { getSource, outletOf, sideOf } from "./sources";
import type { Article, Coverage, Side } from "./types";

/**
 * Counts distinct outlets per side; several articles or feeds from one outlet
 * count once. Outlets without a bias rating are counted in `unrated` and left
 * out of the left/center/right maths.
 */
export function computeCoverage(articles: Article[]): Coverage {
  const sides = new Map<string, Side | null>();
  for (const a of articles) {
    const source = getSource(a.sourceId);
    if (source) sides.set(outletOf(source), sideOf(source.bias));
  }
  const coverage: Coverage = { left: 0, center: 0, right: 0, total: 0, unrated: 0 };
  for (const side of sides.values()) {
    if (side === null) {
      coverage.unrated = (coverage.unrated ?? 0) + 1;
      continue;
    }
    coverage[side] += 1;
    coverage.total += 1;
  }
  return coverage;
}

/** Every outlet that covered a story, rated or not. */
export function outletCount(coverage: Coverage): number {
  return coverage.total + (coverage.unrated ?? 0);
}

/**
 * A story is a blindspot for one side when that side has (almost) no coverage
 * while the other side carries most of it. Returns the side that missed it.
 */
export function findBlindspot(coverage: Coverage, minSources = 3): Side | null {
  if (coverage.total < minSources) return null;
  const leftShare = coverage.left / coverage.total;
  const rightShare = coverage.right / coverage.total;
  if (coverage.right === 0 && leftShare >= 0.6) return "right";
  if (coverage.left === 0 && rightShare >= 0.6) return "left";
  return null;
}

export function percentages(coverage: Coverage): Record<Side, number> {
  if (coverage.total === 0) return { left: 0, center: 0, right: 0 };
  const left = Math.round((coverage.left / coverage.total) * 100);
  const right = Math.round((coverage.right / coverage.total) * 100);
  return { left, center: 100 - left - right, right };
}

/** The side with the largest share, for the "51% Center coverage" line. */
export function dominantSide(coverage: Coverage): { side: Side; pct: number } | null {
  if (coverage.total === 0) return null;
  const pct = percentages(coverage);
  const side = (["center", "left", "right"] as Side[]).sort((a, b) => pct[b] - pct[a])[0];
  return { side, pct: pct[side] };
}

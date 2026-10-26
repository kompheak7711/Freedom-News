import { getSource, sideOf } from "./sources";
import type { Article, Coverage, Side } from "./types";

/** Counts distinct outlets per side; several articles from one outlet count once. */
export function computeCoverage(articles: Article[]): Coverage {
  const sides = new Map<string, Side>();
  for (const a of articles) {
    const source = getSource(a.sourceId);
    if (source) sides.set(source.id, sideOf(source.bias));
  }
  const coverage: Coverage = { left: 0, center: 0, right: 0, total: 0 };
  for (const side of sides.values()) {
    coverage[side] += 1;
    coverage.total += 1;
  }
  return coverage;
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

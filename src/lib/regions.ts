import { getSource } from "./sources";
import type { Article } from "./types";

/** Countries the Local page supports. Cambodia first: the site has a Khmer edition. */
export const LOCATIONS = ["KH", "US", "GB", "AU", "IN"] as const;
export type Location = (typeof LOCATIONS)[number];

export function isLocation(value: string | null | undefined): value is Location {
  return LOCATIONS.includes((value ?? "") as Location);
}

/** Place names that mark a story as local to a country. Kept deliberately specific. */
const PLACE_PATTERNS: Record<Location, RegExp> = {
  KH: /\b(cambodia|cambodian|cambodians|phnom penh|khmer|hun manet|hun sen|siem reap|angkor|sihanoukville|battambang|mekong delta)\b/i,
  US: /\b(u\.s\.|united states|american|americans|washington|congress|white house|senate|pentagon|california|texas|florida|new york|chicago|los angeles)\b/i,
  GB: /\b(uk|u\.k\.|britain|british|england|scotland|wales|northern ireland|london|downing street|westminster|nhs|starmer)\b/i,
  AU: /\b(australia|australian|australians|sydney|melbourne|canberra|queensland|brisbane|perth|albanese)\b/i,
  IN: /\b(india|indian|new delhi|delhi|mumbai|modi|bengaluru|bangalore|kolkata|chennai|hyderabad)\b/i,
};

/**
 * Countries a story is local to. A story is local to a country when one of its
 * articles came from a feed dedicated to that country, or when at least half of
 * its articles name the country or its places in the title or description.
 */
export function detectRegions(articles: Article[]): Location[] {
  const regions = new Set<Location>();
  const mentions = new Map<Location, number>();
  for (const article of articles) {
    const region = getSource(article.sourceId)?.region;
    if (isLocation(region)) regions.add(region);
    const text = `${article.title} ${article.description}`;
    for (const location of LOCATIONS) {
      if (PLACE_PATTERNS[location].test(text)) mentions.set(location, (mentions.get(location) ?? 0) + 1);
    }
  }
  const needed = Math.max(1, Math.ceil(articles.length / 2));
  for (const [location, count] of mentions) {
    if (count >= needed) regions.add(location);
  }
  return LOCATIONS.filter((l) => regions.has(l));
}

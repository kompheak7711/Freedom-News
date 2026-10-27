import { isCategory } from "./categories";
import { outletCount } from "./coverage";
import { getSource, outletOf } from "./sources";
import type { StoryFeed } from "./stories";
import type { Category, Story } from "./types";

/** Followed topics and outlets, stored in a cookie until accounts exist. */
export const PREFS_COOKIE = "fn_prefs";
/** The country chosen on the Local page. */
export const LOCATION_COOKIE = "fn_location";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export interface Prefs {
  topics: Category[];
  outlets: string[];
}

export const EMPTY_PREFS: Prefs = { topics: [], outlets: [] };

export function parsePrefs(raw: string | undefined | null): Prefs {
  if (!raw) return EMPTY_PREFS;
  try {
    const value = JSON.parse(decodeURIComponent(raw)) as Partial<Prefs>;
    return {
      topics: Array.isArray(value.topics) ? value.topics.filter(isCategory) : [],
      outlets: Array.isArray(value.outlets) ? value.outlets.filter((o): o is string => typeof o === "string").slice(0, 100) : [],
    };
  } catch {
    return EMPTY_PREFS;
  }
}

export function serializePrefs(prefs: Prefs): string {
  return encodeURIComponent(JSON.stringify({ topics: prefs.topics, outlets: prefs.outlets }));
}

export function hasPrefs(prefs: Prefs): boolean {
  return prefs.topics.length > 0 || prefs.outlets.length > 0;
}

/** Stories matching followed topics or outlets, best matches first. */
export function personalize(feed: StoryFeed, prefs: Prefs): Story[] {
  if (!hasPrefs(prefs)) return [];
  const topics = new Set(prefs.topics);
  const outlets = new Set(prefs.outlets);
  return feed.stories
    .map((story) => {
      let score = topics.has(story.category) ? 3 : 0;
      const covered = new Set(
        story.articles.map((a) => getSource(a.sourceId)).filter((s) => s && outlets.has(outletOf(s))).map((s) => outletOf(s!)),
      );
      score += covered.size * 2;
      return { story, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || outletCount(b.story.coverage) - outletCount(a.story.coverage))
    .map(({ story }) => story);
}

import { readFile } from "node:fs/promises";
import path from "node:path";
import { unstable_cache } from "next/cache";
import { classifyStory } from "./categories";
import { buildVectors, clusterArticles } from "./cluster";
import { computeCoverage, findBlindspot, outletCount } from "./coverage";
import {
  getDb,
  loadLatestSnapshot,
  loadRecentArticles,
  loadSummaries,
  saveArticles,
  saveSnapshot,
  saveSummary,
  type StoredSummary,
} from "./db";
import { articleId, ingestAll } from "./ingest";
import { getSource } from "./sources";
import { articleLang } from "./khmer";
import { detectRegions, LOCATIONS } from "./regions";
import { extractiveSummary, khmerLooksValid, mapWithConcurrency, sanitizeKhmer, summarizeStory } from "./summarize";
import type { Article, Category, Side, Story, StorySummary } from "./types";

/** How many stories get an LLM summary per refresh. The rest get extractive summaries. */
const MAX_STORIES = Number(process.env.MAX_STORIES ?? 30);
/** How many stories the snapshot keeps, so category pages have depth. */
const MAX_FEED_STORIES = Number(process.env.MAX_FEED_STORIES ?? 80);
/** Khmer-language articles are listed, not clustered; keep the latest few dozen. */
const MAX_KHMER_ARTICLES = 60;
/** Per country, the latest articles from outlets based there, for the Local page. */
const MAX_LOCAL_ARTICLES = 40;
/** Stop starting LLM calls after this long so a refresh fits the 300s route limit. */
const LLM_TIME_BUDGET_MS = 200_000;
/** Stories local to these countries are summarized by Claude whatever their rank: the Khmer edition's readers come first. */
const PRIORITY_REGIONS = ["KH"];
/** A story needs at least this many outlets (rated or not) to make the feed. */
const MIN_SOURCES = 2;
export const REFRESH_SECONDS = 30 * 60;
export const FEED_TAG = "stories";
/** Stories are built from articles published within this window. */
const WINDOW_HOURS = 48;

export interface StoryFeed {
  stories: Story[];
  /** Recent articles from Khmer-language outlets, shown on the Local page for Cambodia. */
  khmerArticles: Article[];
  /**
   * Per country code, the latest English-language articles from feeds dedicated
   * to that country. Local outlets often cover an event alone, which never
   * makes a story (a story needs two outlets), so the Local page lists these too.
   */
  localArticles: Record<string, Article[]>;
  generatedAt: string;
  articleCount: number;
  failedSources: string[];
  demo: boolean;
}

type DemoRow = { story: string; sourceId: string; title: string; description: string; minutesAgo: number };
type DemoKhmer = Record<string, Pick<StorySummary, "headlineKm" | "summaryKm" | "leftFramingKm" | "rightFramingKm">>;

interface LoadedArticles {
  articles: Article[];
  failedSources: string[];
  demo: boolean;
  /** Demo only: article id -> fixture story key, used to attach sample Khmer summaries. */
  demoKeys?: Map<string, string>;
}

async function loadArticles(): Promise<LoadedArticles> {
  if (process.env.NEWS_DEMO === "1") {
    const file = path.join(process.cwd(), "fixtures", "demo-articles.json");
    const rows = JSON.parse(await readFile(file, "utf8")) as DemoRow[];
    const now = Date.now();
    const demoKeys = new Map<string, string>();
    const articles = rows.map((row, i): Article => {
      const url = `https://example.com/demo/${row.sourceId}/${i}`;
      const id = articleId(url);
      demoKeys.set(id, row.story);
      return {
        id,
        sourceId: row.sourceId,
        title: row.title,
        description: row.description,
        url,
        publishedAt: new Date(now - row.minutesAgo * 60_000).toISOString(),
      };
    });
    return { articles, failedSources: [], demo: true, demoKeys };
  }
  const { articles, failedSources } = await ingestAll();
  return { articles, failedSources, demo: false };
}

type Draft = Omit<Story, "summary">;

/**
 * Which stories get a Claude summary: the top `maxStories` by coverage, plus
 * every story local to a priority country and every blindspot, since those
 * rarely reach the top but are what the Local and Blindspot pages show.
 */
export function shouldSummarize(draft: Pick<Draft, "regions" | "blindspot">, index: number, maxStories = MAX_STORIES): boolean {
  if (index < maxStories) return true;
  if (draft.blindspot) return true;
  return draft.regions.some((r) => PRIORITY_REGIONS.includes(r));
}

/** The most distinctive terms of a story, from the TF-IDF vectors of its articles. */
function topTerms(vectors: Array<Map<string, number> | undefined>, n = 5): string[] {
  const sums = new Map<string, number>();
  for (const vec of vectors) {
    if (!vec) continue;
    for (const [term, weight] of vec) sums.set(term, (sums.get(term) ?? 0) + weight);
  }
  return [...sums.entries()]
    .filter(([term]) => term.length >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([term]) => term);
}

/**
 * Groups English-language articles into stories. Khmer-language articles are
 * left out: the clusterer is English-only and they would each form a cluster
 * of their own (see `khmerArticles` on the feed).
 */
export function buildStories(articles: Article[]): Draft[] {
  const english = articles.filter((a) => articleLang(a) === "en");
  const vectors = buildVectors(english);
  const vectorOf = new Map(english.map((a, i) => [a.id, vectors[i]]));
  return clusterArticles(english)
    .map((members): Draft => {
      const coverage = computeCoverage(members);
      const sorted = [...members].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
      const first = sorted[sorted.length - 1];
      const times = members.map((a) => a.publishedAt).sort();
      return {
        // Keyed on the earliest article so the id survives new articles joining.
        id: articleId(first.url),
        articles: sorted,
        coverage,
        blindspot: findBlindspot(coverage),
        firstSeen: times[0],
        lastUpdated: times[times.length - 1],
        imageUrl: sorted.find((a) => a.imageUrl)?.imageUrl,
        category: classifyStory(members),
        regions: detectRegions(members),
        keywords: topTerms(members.map((m) => vectorOf.get(m.id))),
      };
    })
    .filter((s) => outletCount(s.coverage) >= MIN_SOURCES)
    .sort(
      (a, b) =>
        outletCount(b.coverage) - outletCount(a.coverage) ||
        b.coverage.total - a.coverage.total ||
        b.lastUpdated.localeCompare(a.lastUpdated),
    )
    .slice(0, MAX_FEED_STORIES);
}

/**
 * Should a stored summary be reused for a story that now has `count` articles?
 * With the LLM available, a summary that lacks a category or usable Khmer text
 * (missing, or garbled with another script) is rewritten so stories
 * summarized before those checks existed catch up.
 */
export function canReuseSummary(stored: StoredSummary | undefined, count: number, llmAvailable: boolean): boolean {
  if (!stored) return false;
  if (llmAvailable) {
    if (!stored.summary.generated) return false;
    if (!khmerLooksValid(stored.summary) || !stored.summary.category) return false;
  }
  // Rewrite once the story has grown by half, since the facts have likely moved on.
  return count < stored.articleCount * 1.5;
}

function finishStory(draft: Draft, summary: StorySummary): Story {
  return { ...draft, summary, category: summary.category ?? draft.category };
}

async function attachDemoKhmer(stories: Story[], demoKeys: Map<string, string>): Promise<Story[]> {
  const file = path.join(process.cwd(), "fixtures", "demo-khmer-summaries.json");
  const khmer = JSON.parse(await readFile(file, "utf8")) as DemoKhmer;
  return stories.map((story) => {
    const key = story.articles.map((a) => demoKeys.get(a.id)).find(Boolean);
    const sample = key ? khmer[key] : undefined;
    return sample ? { ...story, summary: { ...story.summary, ...sample } } : story;
  });
}

/**
 * Runs the whole pipeline: fetch feeds, store articles, cluster, summarize.
 * With a database, articles accumulate across runs and summaries are reused,
 * so Claude is only called for new or substantially grown stories. The top
 * MAX_STORIES stories, Cambodia-local stories and blindspots get Claude
 * summaries; the rest are extractive. No call starts after the time budget.
 */
export async function refreshFeed(): Promise<StoryFeed> {
  const db = await getDb();
  const loaded = await loadArticles();
  let articles = loaded.articles;
  if (db && !loaded.demo) {
    await saveArticles(db, articles);
    articles = await loadRecentArticles(db, WINDOW_HOURS);
  }

  const drafts = buildStories(articles);
  const stored = db ? await loadSummaries(db, drafts.map((d) => d.id)) : new Map<string, StoredSummary>();
  const llmAvailable = Boolean(process.env.ANTHROPIC_API_KEY);
  const deadline = Date.now() + LLM_TIME_BUDGET_MS;

  let stories = await mapWithConcurrency(drafts, 4, async (draft, index): Promise<Story> => {
    const previous = stored.get(draft.id);
    const useLlm = llmAvailable && shouldSummarize(draft, index) && Date.now() < deadline;
    // Never replace a stored LLM summary with an extractive one.
    if (canReuseSummary(previous, draft.articles.length, llmAvailable) || (previous?.summary.generated && !useLlm)) {
      return finishStory(draft, previous!.summary);
    }
    const summary = useLlm ? await summarizeStory(draft.articles) : extractiveSummary(draft.articles);
    if (db) await saveSummary(db, draft.id, draft.articles.length, summary);
    return finishStory(draft, summary);
  });
  if (loaded.demo && loaded.demoKeys) stories = await attachDemoKhmer(stories, loaded.demoKeys);

  const khmerArticles = articles
    .filter((a) => articleLang(a) === "km")
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, MAX_KHMER_ARTICLES);

  const feed: StoryFeed = {
    stories,
    khmerArticles,
    localArticles: collectLocalArticles(articles),
    generatedAt: new Date().toISOString(),
    articleCount: articles.length,
    failedSources: loaded.failedSources,
    demo: loaded.demo,
  };
  if (db) await saveSnapshot(db, feed.generatedAt, feed);
  return feed;
}

/** The latest English-language articles from each country's own feeds. */
export function collectLocalArticles(articles: Article[]): Record<string, Article[]> {
  const byRegion: Record<string, Article[]> = {};
  for (const region of LOCATIONS) byRegion[region] = [];
  for (const article of articles) {
    const region = getSource(article.sourceId)?.region;
    if (region && region in byRegion && articleLang(article) === "en") byRegion[region].push(article);
  }
  for (const region of LOCATIONS) {
    byRegion[region] = byRegion[region].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, MAX_LOCAL_ARTICLES);
  }
  return byRegion;
}

type StoredStory = Omit<Story, "category" | "regions" | "keywords"> & Partial<Pick<Story, "category" | "regions" | "keywords">>;
type StoredFeed = Omit<StoryFeed, "stories" | "khmerArticles" | "localArticles"> & {
  stories: StoredStory[];
  khmerArticles?: Article[];
  localArticles?: Record<string, Article[]>;
};

/** Fills in fields that snapshots written by older versions lack, and drops garbled Khmer. */
export function normalizeFeed(feed: StoredFeed): StoryFeed {
  return {
    ...feed,
    khmerArticles: feed.khmerArticles ?? [],
    localArticles: feed.localArticles ?? {},
    stories: feed.stories.map((s) => ({
      ...s,
      // Garbled Khmer written before the script check is hidden until the next refresh rewrites it.
      summary: sanitizeKhmer(s.summary),
      coverage: { ...s.coverage, unrated: s.coverage.unrated ?? 0 },
      category: s.category ?? s.summary.category ?? classifyStory(s.articles),
      regions: s.regions ?? detectRegions(s.articles),
      keywords: s.keywords ?? [],
    })),
  };
}

/**
 * With a database, pages read the latest snapshot written by the scheduled
 * refresh (see /api/cron/refresh), and only run the pipeline when none exists.
 * Without one, the pipeline runs inline at most once per refresh window.
 */
async function readFeed(): Promise<StoryFeed> {
  const db = await getDb();
  if (db) {
    const snapshot = await loadLatestSnapshot<StoredFeed>(db);
    if (snapshot) return normalizeFeed(snapshot);
  }
  return refreshFeed();
}

export const getStoryFeed = unstable_cache(readFeed, ["story-feed-v2"], {
  revalidate: REFRESH_SECONDS,
  tags: [FEED_TAG],
});

export async function getStory(id: string): Promise<Story | undefined> {
  const feed = await getStoryFeed();
  return feed.stories.find((s) => s.id === id);
}

// Selectors shared by the pages. They work on a feed so tests need no database.

export function storiesInCategory(feed: StoryFeed, category: Category): Story[] {
  return feed.stories.filter((s) => s.category === category);
}

/** Stories one side barely covered. `side` is the side that missed them. */
export function blindspotStories(feed: StoryFeed, side?: Side): Story[] {
  return feed.stories.filter((s) => s.blindspot && (!side || s.blindspot === side));
}

export function localStories(feed: StoryFeed, country: string): Story[] {
  return feed.stories.filter((s) => s.regions.includes(country));
}

/** Articles from a country's own outlets that are not already in one of its stories. */
export function localArticles(feed: StoryFeed, country: string): Article[] {
  const shown = new Set(localStories(feed, country).flatMap((s) => s.articles.map((a) => a.id)));
  return (feed.localArticles[country] ?? []).filter((a) => !shown.has(a.id));
}

/** Other stories in the same section or sharing distinctive terms. */
export function relatedStories(feed: StoryFeed, story: Story, limit = 6): Story[] {
  const keywords = new Set(story.keywords);
  return feed.stories
    .filter((s) => s.id !== story.id)
    .map((s) => ({ s, score: (s.category === story.category ? 1 : 0) + s.keywords.filter((k) => keywords.has(k)).length * 2 }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || outletCount(b.s.coverage) - outletCount(a.s.coverage))
    .slice(0, limit)
    .map(({ s }) => s);
}

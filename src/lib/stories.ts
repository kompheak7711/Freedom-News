import { readFile } from "node:fs/promises";
import path from "node:path";
import { unstable_cache } from "next/cache";
import { clusterArticles } from "./cluster";
import { computeCoverage, findBlindspot } from "./coverage";
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
import { mapWithConcurrency, summarizeStory } from "./summarize";
import type { Article, Story } from "./types";

/** How many stories get an LLM summary per refresh. */
const MAX_STORIES = Number(process.env.MAX_STORIES ?? 30);
/** A story needs at least this many outlets to make the front page. */
const MIN_SOURCES = 2;
export const REFRESH_SECONDS = 30 * 60;
export const FEED_TAG = "stories";
/** Stories are built from articles published within this window. */
const WINDOW_HOURS = 48;

export interface StoryFeed {
  stories: Story[];
  generatedAt: string;
  articleCount: number;
  failedSources: string[];
  demo: boolean;
}

type DemoRow = { story: string; sourceId: string; title: string; description: string; minutesAgo: number };

async function loadArticles(): Promise<{ articles: Article[]; failedSources: string[]; demo: boolean }> {
  if (process.env.NEWS_DEMO === "1") {
    const file = path.join(process.cwd(), "fixtures", "demo-articles.json");
    const rows = JSON.parse(await readFile(file, "utf8")) as DemoRow[];
    const now = Date.now();
    const articles = rows.map((row, i): Article => {
      const url = `https://example.com/demo/${row.sourceId}/${i}`;
      return {
        id: articleId(url),
        sourceId: row.sourceId,
        title: row.title,
        description: row.description,
        url,
        publishedAt: new Date(now - row.minutesAgo * 60_000).toISOString(),
      };
    });
    return { articles, failedSources: [], demo: true };
  }
  const { articles, failedSources } = await ingestAll();
  return { articles, failedSources, demo: false };
}

export function buildStories(articles: Article[]): Omit<Story, "summary">[] {
  return clusterArticles(articles)
    .map((members) => {
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
      };
    })
    .filter((s) => s.coverage.total >= MIN_SOURCES)
    .sort((a, b) => b.coverage.total - a.coverage.total || b.lastUpdated.localeCompare(a.lastUpdated))
    .slice(0, MAX_STORIES);
}

/** Should a stored summary be reused for a story that now has `count` articles? */
export function canReuseSummary(stored: StoredSummary | undefined, count: number, llmAvailable: boolean): boolean {
  if (!stored) return false;
  if (llmAvailable && !stored.summary.generated) return false;
  // Rewrite once the story has grown by half, since the facts have likely moved on.
  return count < stored.articleCount * 1.5;
}

/**
 * Runs the whole pipeline: fetch feeds, store articles, cluster, summarize.
 * With a database, articles accumulate across runs and summaries are reused,
 * so Claude is only called for new or substantially grown stories.
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

  const stories = await mapWithConcurrency(drafts, 4, async (draft): Promise<Story> => {
    const previous = stored.get(draft.id);
    if (canReuseSummary(previous, draft.articles.length, llmAvailable)) {
      return { ...draft, summary: previous!.summary };
    }
    const summary = await summarizeStory(draft.articles);
    if (db) await saveSummary(db, draft.id, draft.articles.length, summary);
    return { ...draft, summary };
  });

  const feed: StoryFeed = {
    stories,
    generatedAt: new Date().toISOString(),
    articleCount: articles.length,
    failedSources: loaded.failedSources,
    demo: loaded.demo,
  };
  if (db) await saveSnapshot(db, feed.generatedAt, feed);
  return feed;
}

/**
 * With a database, pages read the latest snapshot written by the scheduled
 * refresh (see /api/cron/refresh), and only run the pipeline when none exists.
 * Without one, the pipeline runs inline at most once per refresh window.
 */
async function readFeed(): Promise<StoryFeed> {
  const db = await getDb();
  if (db) {
    const snapshot = await loadLatestSnapshot<StoryFeed>(db);
    if (snapshot) return snapshot;
  }
  return refreshFeed();
}

export const getStoryFeed = unstable_cache(readFeed, ["story-feed"], {
  revalidate: REFRESH_SECONDS,
  tags: [FEED_TAG],
});

export async function getStory(id: string): Promise<Story | undefined> {
  const feed = await getStoryFeed();
  return feed.stories.find((s) => s.id === id);
}

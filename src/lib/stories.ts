import { readFile } from "node:fs/promises";
import path from "node:path";
import { unstable_cache } from "next/cache";
import { clusterArticles } from "./cluster";
import { computeCoverage, findBlindspot } from "./coverage";
import { articleId, ingestAll } from "./ingest";
import { mapWithConcurrency, summarizeStory } from "./summarize";
import type { Article, Story } from "./types";

/** How many stories get an LLM summary per refresh. */
const MAX_STORIES = Number(process.env.MAX_STORIES ?? 30);
/** A story needs at least this many outlets to make the front page. */
const MIN_SOURCES = 2;
export const REFRESH_SECONDS = 30 * 60;

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
      const times = members.map((a) => a.publishedAt).sort();
      const sorted = [...members].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
      return {
        id: articleId(times[0] + members.map((a) => a.url).sort()[0]),
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

async function generateFeed(): Promise<StoryFeed> {
  const { articles, failedSources, demo } = await loadArticles();
  const drafts = buildStories(articles);
  const stories = await mapWithConcurrency(drafts, 4, async (draft) => ({
    ...draft,
    summary: await summarizeStory(draft.articles),
  }));
  return {
    stories,
    generatedAt: new Date().toISOString(),
    articleCount: articles.length,
    failedSources,
    demo,
  };
}

/** The whole pipeline, cached so feeds and the LLM are hit once per refresh window. */
export const getStoryFeed = unstable_cache(generateFeed, ["story-feed"], {
  revalidate: REFRESH_SECONDS,
  tags: ["stories"],
});

export async function getStory(id: string): Promise<Story | undefined> {
  const feed = await getStoryFeed();
  return feed.stories.find((s) => s.id === id);
}

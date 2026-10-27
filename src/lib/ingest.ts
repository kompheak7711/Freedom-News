import { createHash } from "node:crypto";
import Parser from "rss-parser";
import { SOURCES } from "./sources";
import type { Article, Source } from "./types";

type FeedItem = {
  title?: string;
  link?: string;
  guid?: string;
  isoDate?: string;
  pubDate?: string;
  contentSnippet?: string;
  summary?: string;
  enclosure?: { url?: string; type?: string };
  "media:content"?: { $?: { url?: string } };
  "media:thumbnail"?: { $?: { url?: string } };
};

const parser = new Parser<Record<string, unknown>, FeedItem>({
  timeout: 10_000,
  headers: { "User-Agent": "FreedomNews/0.1 (+https://github.com)" },
  customFields: { item: ["media:content", "media:thumbnail"] },
});

/** Articles older than this are ignored. */
const MAX_AGE_MS = 48 * 60 * 60 * 1000;
/** Some feeds carry 150 items; the newest few dozen are plenty for a 48h window. */
const MAX_ITEMS_PER_FEED = 40;

export function articleId(url: string): string {
  return createHash("sha1").update(url).digest("hex").slice(0, 12);
}

export function cleanText(text: string | undefined): string {
  return (text ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function imageOf(item: FeedItem): string | undefined {
  const media = item["media:content"]?.$?.url ?? item["media:thumbnail"]?.$?.url;
  if (media) return media;
  if (item.enclosure?.url && (item.enclosure.type ?? "image").startsWith("image")) {
    return item.enclosure.url;
  }
  return undefined;
}

export function toArticles(source: Source, items: FeedItem[], now = Date.now()): Article[] {
  const articles: Article[] = [];
  for (const item of items) {
    const url = item.link ?? item.guid;
    const title = cleanText(item.title);
    if (!url || !title) continue;

    const published = new Date(item.isoDate ?? item.pubDate ?? now);
    const publishedMs = Number.isNaN(published.getTime()) ? now : published.getTime();
    if (now - publishedMs > MAX_AGE_MS) continue;

    articles.push({
      id: articleId(url),
      sourceId: source.id,
      title,
      description: cleanText(item.contentSnippet ?? item.summary).slice(0, 600),
      url,
      publishedAt: new Date(publishedMs).toISOString(),
      imageUrl: imageOf(item),
    });
  }
  return articles;
}

async function fetchSource(source: Source): Promise<Article[]> {
  const feed = await parser.parseURL(source.feedUrl);
  return toArticles(source, feed.items)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, MAX_ITEMS_PER_FEED);
}

export interface IngestResult {
  articles: Article[];
  failedSources: string[];
}

/** Fetches every feed in parallel. A failing feed is skipped, not fatal. */
export async function ingestAll(sources: Source[] = SOURCES): Promise<IngestResult> {
  const results = await Promise.allSettled(sources.map(fetchSource));
  const seen = new Set<string>();
  const articles: Article[] = [];
  const failedSources: string[] = [];

  results.forEach((result, i) => {
    if (result.status === "rejected") {
      failedSources.push(sources[i].id);
      console.warn(`[ingest] ${sources[i].id} failed: ${String(result.reason)}`);
      return;
    }
    for (const article of result.value) {
      if (seen.has(article.id)) continue;
      seen.add(article.id);
      articles.push(article);
    }
  });

  return { articles, failedSources };
}

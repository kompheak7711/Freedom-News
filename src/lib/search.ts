import { tokenize } from "./cluster";
import { getDb, searchArticles } from "./db";
import { isKhmerText, segmentKhmer } from "./khmer";
import { getSource } from "./sources";
import type { StoryFeed } from "./stories";
import type { Article, Story } from "./types";

export interface SearchResults {
  query: string;
  stories: Story[];
  articles: Article[];
}

/** Terms a query must match. Khmer queries are segmented, everything else tokenized. */
export function queryTerms(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  if (isKhmerText(trimmed)) {
    const words = segmentKhmer(trimmed);
    return words.length ? words : [trimmed];
  }
  const tokens = tokenize(trimmed);
  return tokens.length ? tokens : [trimmed.toLowerCase()];
}

function matches(haystack: string, terms: string[]): boolean {
  const text = haystack.toLowerCase();
  return terms.every((t) => text.includes(t));
}

function storyText(story: Story): string {
  const s = story.summary;
  const outlets = story.articles.map((a) => getSource(a.sourceId)?.name ?? "").join(" ");
  return [s.headline, s.summary, s.headlineKm, s.summaryKm, story.category, ...story.keywords, ...story.articles.map((a) => a.title), outlets]
    .filter(Boolean)
    .join("\n");
}

function articleText(article: Article): string {
  return `${article.title}\n${article.description}\n${getSource(article.sourceId)?.name ?? ""}`;
}

/** Searches the current feed in memory: stories, their articles and Khmer-language articles. */
export function searchFeed(feed: StoryFeed, query: string): SearchResults {
  const terms = queryTerms(query);
  if (terms.length === 0) return { query, stories: [], articles: [] };
  const stories = feed.stories.filter((s) => matches(storyText(s), terms));
  const seen = new Set<string>();
  const articles: Article[] = [];
  for (const article of [...feed.stories.flatMap((s) => s.articles), ...feed.khmerArticles]) {
    if (seen.has(article.id) || !matches(articleText(article), terms)) continue;
    seen.add(article.id);
    articles.push(article);
  }
  articles.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return { query, stories, articles };
}

/** Feed search plus, with a database, older stored articles. */
export async function searchEverything(feed: StoryFeed, query: string): Promise<SearchResults> {
  const results = searchFeed(feed, query);
  const db = await getDb();
  if (db && query.trim().length >= 2) {
    try {
      const seen = new Set(results.articles.map((a) => a.id));
      for (const article of await searchArticles(db, query.trim())) {
        if (!seen.has(article.id)) results.articles.push(article);
      }
      results.articles.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    } catch (err) {
      console.warn(`[search] database search failed: ${String(err)}`);
    }
  }
  results.articles = results.articles.slice(0, 60);
  return results;
}

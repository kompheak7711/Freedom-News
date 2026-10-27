import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  closeDb,
  getDb,
  loadLatestSnapshot,
  loadRecentArticles,
  loadSummaries,
  saveArticles,
  saveSnapshot,
  saveSummary,
} from "../db";
import { canReuseSummary, refreshFeed, type StoryFeed } from "../stories";
import type { StorySummary } from "../types";

const summary = (generated: boolean, khmer = true): StorySummary => ({
  headline: "h",
  summary: "s",
  leftFraming: null,
  rightFraming: null,
  generated,
  category: "world",
  ...(khmer ? { headlineKm: "ចំណងជើង", summaryKm: "សេចក្តីសង្ខេប", leftFramingKm: null, rightFramingKm: null } : {}),
});

describe("canReuseSummary", () => {
  it("reuses until the story grows by half", () => {
    const stored = { articleCount: 4, summary: summary(true) };
    expect(canReuseSummary(stored, 5, true)).toBe(true);
    expect(canReuseSummary(stored, 6, true)).toBe(false);
    expect(canReuseSummary(undefined, 3, true)).toBe(false);
  });

  it("replaces a fallback summary once the LLM is available", () => {
    const stored = { articleCount: 4, summary: summary(false) };
    expect(canReuseSummary(stored, 4, true)).toBe(false);
    expect(canReuseSummary(stored, 4, false)).toBe(true);
  });

  it("rewrites a summary stored without Khmer or a category once the LLM is available", () => {
    const noKhmer = { articleCount: 4, summary: summary(true, false) };
    expect(canReuseSummary(noKhmer, 4, true)).toBe(false);
    // Without the LLM there is nothing better to replace it with.
    expect(canReuseSummary(noKhmer, 4, false)).toBe(true);
    const noCategory = { articleCount: 4, summary: { ...summary(true), category: undefined } };
    expect(canReuseSummary(noCategory, 4, true)).toBe(false);
    // Khmer that strayed into Thai script counts as missing.
    const garbled = { articleCount: 4, summary: { ...summary(true), headlineKm: "ហារ\u0E35 ខេន" } };
    expect(canReuseSummary(garbled, 4, true)).toBe(false);
    expect(canReuseSummary(garbled, 4, false)).toBe(true);
  });

  it("waits out khmerRetryAfter before spending calls on Khmer that failed twice", () => {
    const now = Date.parse("2026-10-27T20:00:00Z");
    const dropped = { ...summary(true, false), khmerRetryAfter: "2026-10-28T02:00:00Z" };
    expect(canReuseSummary({ articleCount: 4, summary: dropped }, 4, true, now)).toBe(true);
    expect(canReuseSummary({ articleCount: 4, summary: dropped }, 4, true, Date.parse("2026-10-28T03:00:00Z"))).toBe(false);
    // Growth still forces a rewrite.
    expect(canReuseSummary({ articleCount: 4, summary: dropped }, 6, true, now)).toBe(false);
  });
});

// Runs against a real Postgres when TEST_DATABASE_URL is set, e.g.
// TEST_DATABASE_URL=postgres://localhost:5432/news_test npm test
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("postgres storage", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    const db = (await getDb())!;
    await db`truncate articles, story_summaries, feed_snapshots`;
  });
  afterAll(async () => {
    await closeDb();
    delete process.env.DATABASE_URL;
    delete process.env.NEWS_DEMO;
  });

  it("upserts articles and loads only recent ones", async () => {
    const db = (await getDb())!;
    const now = Date.now();
    const base = { sourceId: "bbc", description: "d", url: "https://x" };
    await saveArticles(db, [
      { ...base, id: "new", title: "New", publishedAt: new Date(now - 3600_000).toISOString() },
      { ...base, id: "old", title: "Old", publishedAt: new Date(now - 72 * 3600_000).toISOString() },
    ]);
    await saveArticles(db, [{ ...base, id: "new", title: "New (updated)", publishedAt: new Date(now - 3600_000).toISOString() }]);
    const recent = await loadRecentArticles(db, 48);
    expect(recent.map((a) => [a.id, a.title])).toEqual([["new", "New (updated)"]]);
  });

  it("stores summaries and snapshots", async () => {
    const db = (await getDb())!;
    await saveSummary(db, "story1", 3, summary(true));
    await saveSummary(db, "story1", 5, summary(true));
    const stored = await loadSummaries(db, ["story1", "missing"]);
    expect(stored.get("story1")).toEqual({ articleCount: 5, summary: summary(true) });
    expect(stored.has("missing")).toBe(false);

    await saveSnapshot(db, new Date().toISOString(), { hello: "world" });
    expect(await loadLatestSnapshot(db)).toEqual({ hello: "world" });
  });

  it("refreshFeed persists summaries and a snapshot", async () => {
    process.env.NEWS_DEMO = "1";
    const feed = await refreshFeed();
    expect(feed.stories).toHaveLength(6);
    expect(feed.khmerArticles).toHaveLength(3);
    const db = (await getDb())!;
    const stored = await loadSummaries(db, feed.stories.map((s) => s.id));
    expect(stored.size).toBe(6);
    const snapshot = await loadLatestSnapshot<StoryFeed>(db);
    expect(snapshot?.generatedAt).toBe(feed.generatedAt);
  });
});

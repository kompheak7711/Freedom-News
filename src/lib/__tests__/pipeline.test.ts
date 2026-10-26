import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { clusterArticles, tokenize } from "../cluster";
import { computeCoverage, findBlindspot, percentages } from "../coverage";
import { toArticles } from "../ingest";
import { getSource } from "../sources";
import type { Article } from "../types";

type DemoRow = { story: string; sourceId: string; title: string; description: string; minutesAgo: number };

const now = Date.parse("2026-10-26T12:00:00Z");
const rows = JSON.parse(
  readFileSync(path.join(__dirname, "../../../fixtures/demo-articles.json"), "utf8"),
) as DemoRow[];
const demo: Article[] = rows.map((r, i) => ({
  id: String(i),
  sourceId: r.sourceId,
  title: r.title,
  description: r.description,
  url: `https://example.com/${i}`,
  publishedAt: new Date(now - r.minutesAgo * 60_000).toISOString(),
}));

function article(sourceId: string, title: string): Article {
  return { id: sourceId + title, sourceId, title, description: "", url: "u", publishedAt: new Date(now).toISOString() };
}

describe("tokenize", () => {
  it("drops stopwords, short tokens, numbers and accents", () => {
    expect(tokenize("The Président said 2026 rates are up")).toEqual(["president", "rates"]);
  });
});

describe("clusterArticles", () => {
  it("groups the demo fixture into its five stories", () => {
    const clusters = clusterArticles(demo);
    const storyOf = (a: Article) => rows[Number(a.id)].story;
    expect(clusters).toHaveLength(5);
    for (const c of clusters) {
      expect(new Set(c.map(storyOf)).size).toBe(1);
    }
  });

  it("keeps unrelated stories apart", () => {
    const clusters = clusterArticles([
      article("bbc", "Earthquake strikes northern mountains"),
      article("fox", "Senate passes farm subsidy bill"),
    ]);
    expect(clusters).toHaveLength(2);
  });
});

describe("coverage", () => {
  it("counts each outlet once and maps lean ratings to sides", () => {
    const cov = computeCoverage([
      article("guardian", "a"),
      article("guardian", "b"),
      article("bbc", "c"),
      article("nypost", "d"),
    ]);
    expect(cov).toEqual({ left: 1, center: 1, right: 1, total: 3 });
    expect(percentages(cov)).toEqual({ left: 33, center: 34, right: 33 });
  });

  it("flags a story only one side covered as a blindspot for the other", () => {
    expect(findBlindspot({ left: 0, center: 0, right: 4, total: 4 })).toBe("left");
    expect(findBlindspot({ left: 3, center: 1, right: 0, total: 4 })).toBe("right");
    expect(findBlindspot({ left: 2, center: 1, right: 1, total: 4 })).toBeNull();
    expect(findBlindspot({ left: 2, center: 0, right: 0, total: 2 })).toBeNull();
  });
});

describe("toArticles", () => {
  it("cleans HTML, skips stale or untitled items", () => {
    const source = getSource("bbc")!;
    const articles = toArticles(
      source,
      [
        { title: "<b>Fresh</b> &amp; new", link: "https://x/1", isoDate: "2026-10-26T10:00:00Z", contentSnippet: "<p>Hi</p>" },
        { title: "Old", link: "https://x/2", isoDate: "2026-10-01T10:00:00Z" },
        { link: "https://x/3" },
      ],
      now,
    );
    expect(articles).toHaveLength(1);
    expect(articles[0]).toMatchObject({ title: "Fresh & new", description: "Hi", sourceId: "bbc" });
  });
});

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { clusterArticles, pickLead, tokenize } from "../cluster";
import { computeCoverage, findBlindspot, percentages } from "../coverage";
import { toArticles } from "../ingest";
import { articleLang } from "../khmer";
import { getSource } from "../sources";
import type { Article } from "../types";

type DemoRow = { story: string; sourceId: string; title: string; description: string; minutesAgo: number };

const now = Date.parse("2026-10-26T12:00:00Z");
const rows = JSON.parse(
  readFileSync(path.join(__dirname, "../../../fixtures/demo-articles.json"), "utf8"),
) as DemoRow[];
const allDemo: Article[] = rows.map((r, i) => ({
  id: String(i),
  sourceId: r.sourceId,
  title: r.title,
  description: r.description,
  url: `https://example.com/${i}`,
  publishedAt: new Date(now - r.minutesAgo * 60_000).toISOString(),
}));
// The clusterer only ever sees English articles (see buildStories).
const demo = allDemo.filter((a) => articleLang(a) === "en");

function article(sourceId: string, title: string, description = ""): Article {
  return { id: sourceId + title, sourceId, title, description, url: "u", publishedAt: new Date(now).toISOString() };
}

const clusterOf = (clusters: Article[][], a: Article) => clusters.find((c) => c.includes(a));

describe("tokenize", () => {
  it("drops stopwords, short tokens, numbers and accents", () => {
    expect(tokenize("The Président said 2026 rates are up")).toEqual(["president", "rates"]);
  });
});

describe("clusterArticles", () => {
  it("groups the demo fixture into its six English stories", () => {
    const clusters = clusterArticles(demo);
    const storyOf = (a: Article) => rows[Number(a.id)].story;
    expect(clusters).toHaveLength(6);
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

  // Headlines from a live day of news that the first version grouped wrongly. The demo
  // fixture is background so word rarity resembles a real day of news.
  it("does not join stories that only share a famous name", () => {
    const starlink = [
      article("abc", "Ukraine disputes Musk's claim that its military violated Starlink's terms of service", "Musk claimed Ukraine used Starlink for offensive drone strikes."),
      article("cnbc", "Ukraine disputes Elon Musk's claim that its military violated Starlink terms during drone operations", "Ukraine challenged Musk's claim that its military violated Starlink terms."),
      article("cbs", "Elon Musk's Starlink and Starshield, and what they mean to Ukraine", "Here's what to know about Starlink and Starshield, the technologies Ukraine is relying on in the war against Russia."),
    ];
    const debt = article("cnbc", "SpaceX closes $40 billion debt deal for AI chips, Elon Musk says");
    const neoclouds = article("cnbc", "Elon Musk says more than 200 neoclouds face 'guppy-level death'", "Investors are already questioning the debt-fueled expansion of neoclouds.");
    const clusters = clusterArticles([...demo, ...starlink, debt, neoclouds]);
    expect(clusterOf(clusters, starlink[0])).toEqual(expect.arrayContaining(starlink));
    expect(clusterOf(clusters, starlink[0])).not.toContain(neoclouds);
    expect(clusterOf(clusters, starlink[0])).not.toContain(debt);
  });

  it("ignores an outlet's recurring boilerplate such as a show name", () => {
    // Shaped like CBS transcript headlines, where the show name outweighs the guest.
    const show = (guest: string) =>
      article("cbs", `Transcript: ${guest} on "Face the Nation with Margaret Brennan"`, `The transcript of the interview with ${guest} that aired on "Face the Nation with Margaret Brennan."`);
    const tillis = show("Sen. Thom Tillis");
    const hinojosa = show("Gina Hinojosa");
    const crow = show("Rep. Jason Crow");
    const clusters = clusterArticles([...demo, tillis, hinojosa, crow]);
    expect(clusterOf(clusters, tillis)).toEqual([tillis]);
    expect(clusterOf(clusters, hinojosa)).toEqual([hinojosa]);
  });
});

describe("pickLead", () => {
  it("picks the article most typical of the story, not an outlier", () => {
    const lead = article("nbc", "Ukraine disputes Musk claim over Starlink terms", "Kyiv denies its military breached Starlink terms.");
    const others = [
      article("abc", "Ukraine disputes Musk claim it violated Starlink terms", "Ukraine says it did not breach Starlink terms."),
      article("cnbc", "Musk claim on Starlink terms disputed by Ukraine", "Kyiv rejects Musk claim on Starlink terms."),
      article("huffpost", "Musk says he was behind speed restriction", "Service restored to previous speeds."),
    ];
    expect(pickLead([others[2], lead, ...others.slice(0, 2)]).sourceId).not.toBe("huffpost");
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
    expect(cov).toEqual({ left: 1, center: 1, right: 1, total: 3, unrated: 0 });
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

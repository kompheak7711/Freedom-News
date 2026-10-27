import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { classifyStory, classifyText, isCategory } from "../categories";
import { computeCoverage, findBlindspot, outletCount, percentages } from "../coverage";
import { articleLang, hasForeignScript, isKhmerText, looksGarbledKhmer, segmentKhmer } from "../khmer";
import { hasPrefs, parsePrefs, personalize, serializePrefs } from "../prefs";
import { detectRegions } from "../regions";
import { queryTerms, searchFeed } from "../search";
import { OUTLETS, SOURCES, getSource, outletOf, sideOf } from "../sources";
import { buildStories, collectLocalArticles, localArticles, normalizeFeed, shouldSummarize, type StoryFeed } from "../stories";
import { extractiveSummary, hasKhmer, khmerLooksValid, sanitizeKhmer } from "../summarize";
import { localizedSummary } from "../text";
import type { Article, Story, StorySummary } from "../types";

const now = Date.parse("2026-10-26T12:00:00Z");

// Background articles so word rarity resembles a real day of news: in a corpus of
// two articles every shared word has zero IDF weight and nothing clusters.
type DemoRow = { story: string; sourceId: string; title: string; description: string; minutesAgo: number };
const background: Article[] = (
  JSON.parse(readFileSync(path.join(__dirname, "../../../fixtures/demo-articles.json"), "utf8")) as DemoRow[]
).map((r, i) => ({
  id: `bg${i}`,
  sourceId: r.sourceId,
  title: r.title,
  description: r.description,
  url: `https://example.com/bg/${i}`,
  publishedAt: new Date(now - r.minutesAgo * 60_000).toISOString(),
}));

function article(sourceId: string, title: string, description = "", minutesAgo = 0): Article {
  return {
    id: `${sourceId}:${title}`,
    sourceId,
    title,
    description,
    url: `https://example.com/${sourceId}/${encodeURIComponent(title)}`,
    publishedAt: new Date(now - minutesAgo * 60_000).toISOString(),
  };
}

const summary = (over: Partial<StorySummary> = {}): StorySummary => ({
  headline: "Central bank holds rates",
  summary: "The central bank held interest rates steady.",
  leftFraming: "Left outlets stressed cooling inflation.",
  rightFraming: null,
  generated: true,
  category: "business",
  ...over,
});

function story(over: Partial<Story> = {}): Story {
  const articles = over.articles ?? [article("bbc", "Central bank holds rates"), article("fox", "Rates held as prices bite")];
  return {
    id: over.id ?? "s1",
    articles,
    coverage: computeCoverage(articles),
    blindspot: null,
    firstSeen: articles[0].publishedAt,
    lastUpdated: articles[0].publishedAt,
    summary: summary(),
    category: "business",
    regions: [],
    keywords: ["rates", "bank"],
    ...over,
  };
}

const feedOf = (stories: Story[], khmerArticles: Article[] = [], local: Record<string, Article[]> = {}): StoryFeed => ({
  stories,
  khmerArticles,
  localArticles: local,
  generatedAt: new Date(now).toISOString(),
  articleCount: stories.reduce((n, s) => n + s.articles.length, 0),
  failedSources: [],
  demo: true,
});

describe("sources", () => {
  it("keeps feed ids unique and groups section feeds under their outlet", () => {
    const ids = SOURCES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SOURCES) {
      if (s.outlet) {
        const outlet = getSource(s.outlet)!;
        expect(outlet, `${s.id} points at a missing outlet`).toBeDefined();
        expect(outlet.outlet).toBeUndefined();
        expect(s.bias).toBe(outlet.bias);
      }
    }
    expect(OUTLETS.every((o) => !o.outlet)).toBe(true);
  });

  it("marks Cambodian outlets as unrated and maps unrated to no side", () => {
    for (const id of ["khmertimes", "phnompenhpost", "camboja", "rfakhmer"]) {
      expect(getSource(id)?.bias).toBe("unrated");
    }
    expect(sideOf("unrated")).toBeNull();
    expect(sideOf("lean-left")).toBe("left");
    expect(outletOf(getSource("bbc-business")!)).toBe("bbc");
  });
});

describe("coverage with unrated outlets", () => {
  it("leaves unrated outlets out of the left/center/right maths", () => {
    const cov = computeCoverage([
      article("khmertimes", "a"),
      article("phnompenhpost", "b"),
      article("bbc", "c"),
      article("guardian", "d"),
    ]);
    expect(cov).toEqual({ left: 1, center: 1, right: 0, total: 2, unrated: 2 });
    expect(percentages(cov)).toEqual({ left: 50, center: 50, right: 0 });
    expect(outletCount(cov)).toBe(4);
    // Two rated outlets are below the blindspot minimum however many unrated ones joined.
    expect(findBlindspot(cov)).toBeNull();
  });

  it("counts several feeds of one outlet once", () => {
    const cov = computeCoverage([article("bbc", "a"), article("bbc-business", "b"), article("bbc-uk", "c")]);
    expect(cov).toEqual({ left: 0, center: 1, right: 0, total: 1, unrated: 0 });
  });
});

describe("category classifier", () => {
  it("classifies by keywords", () => {
    expect(classifyText("Central bank holds interest rates steady as inflation cools")).toBe("business");
    expect(classifyText("Striker scores twice as the Premier League leaders win again")).toBe("sports");
    expect(classifyText("Scientists find methane leak using new satellite")).toBe("science");
    expect(classifyText("Hospital doctors warn of measles outbreak")).toBe("health");
    expect(classifyText("Lorem ipsum dolor sit amet")).toBeNull();
    expect(isCategory("sports")).toBe(true);
    expect(isCategory("weather")).toBe(false);
  });

  it("defaults a story to world and lets section feeds outvote weak keywords", () => {
    expect(classifyStory([article("bbc", "Earthquake strikes northern mountains"), article("cnn", "Quake hits mountain villages")])).toBe("world");
    // Articles filed in business sections win even when the title has no business words.
    const sectioned = [article("bbc-business", "Firm announces new plan"), article("cnbc-business", "Plan announced by firm")];
    expect(classifyStory(sectioned)).toBe("business");
    // One stray keyword across several articles is not enough to leave "world".
    const stray = [
      article("bbc", "Ceasefire talks resume"),
      article("cnn", "Talks on ceasefire resume"),
      article("npr", "Ceasefire talks resume as film crew watches"),
    ];
    expect(classifyStory(stray)).toBe("world");
  });

  it("gives extractive summaries a category", () => {
    const s = extractiveSummary([article("bbc", "Central bank holds interest rates steady"), article("cnbc-business", "Rates held")]);
    expect(s.generated).toBe(false);
    expect(s.category).toBe("business");
    expect(hasKhmer(s)).toBe(false);
  });
});

describe("regions", () => {
  it("marks stories local from regional feeds or repeated place names", () => {
    expect(detectRegions([article("khmertimes", "Ministry opens new bridge"), article("bbc", "New bridge opens")])).toEqual(["KH"]);
    expect(detectRegions([article("bbc", "Cambodia and Thailand reopen border"), article("aljazeera", "Cambodia border crossings reopen")])).toEqual(["KH"]);
    // One mention in a four-article story is not enough.
    expect(
      detectRegions([
        article("bbc", "Trade talks resume"),
        article("cnn", "Trade talks resume in Geneva"),
        article("npr", "Talks resume"),
        article("fox", "Talks resume, Australia watching"),
      ]),
    ).toEqual([]);
    expect(detectRegions([article("npr-us", "Senate passes bill"), article("bbc-uk", "Commons debates bill")])).toEqual(["US", "GB"]);
  });

  it("does not call a world story local to the US just because Trump is quoted", () => {
    expect(detectRegions([article("bbc", "Lula wins Brazil runoff; Trump calls vote rigged"), article("cnn", "Trump says Brazil vote was rigged")])).toEqual([]);
  });
});

describe("local articles", () => {
  it("keeps the latest English articles from each country's own feeds", () => {
    const local = collectLocalArticles([
      article("phnompenhpost", "Ministry opens bridge", "", 10),
      article("camboja", "Union protests factory closure", "", 5),
      article("rfakhmer", "ព័ត៌មានជាភាសាខ្មែរ", "", 1),
      article("bbc-uk", "Rail strike announced", "", 2),
      article("bbc", "World news", "", 0),
    ]);
    expect(local.KH.map((a) => a.sourceId)).toEqual(["camboja", "phnompenhpost"]);
    expect(local.GB.map((a) => a.sourceId)).toEqual(["bbc-uk"]);
    expect(local.US).toEqual([]);
  });

  it("hides articles that already appear in a local story", () => {
    const inStory = article("phnompenhpost", "Border crossings reopen");
    const alone = article("camboja", "Union protests factory closure");
    const s = story({ id: "border", regions: ["KH"], articles: [inStory, article("bbc", "Cambodia border crossings reopen")] });
    const feed = feedOf([s], [], { KH: [inStory, alone] });
    expect(localArticles(feed, "KH")).toEqual([alone]);
    expect(localArticles(feed, "US")).toEqual([]);
  });
});

describe("khmer", () => {
  it("detects Khmer text and segments it into words", () => {
    expect(isKhmerText("តម្លៃសាំងនៅកម្ពុជាឡើងថ្លៃ")).toBe(true);
    expect(isKhmerText("Prices rise in Cambodia")).toBe(false);
    expect(segmentKhmer("តម្លៃសាំងនៅកម្ពុជា")).toContain("កម្ពុជា");
  });

  it("takes the language from the source, else from the script", () => {
    expect(articleLang(article("rfakhmer", "Latin title from a Khmer feed"))).toBe("km");
    expect(articleLang(article("bbc", "English"))).toBe("en");
    expect(articleLang(article("unknown-source", "ព័ត៌មាន"))).toBe("km");
  });

  it("keeps Khmer-language articles out of the clusters", () => {
    const stories = buildStories([
      ...background,
      article("bbc", "Volcano erupts on remote island, villages evacuated"),
      article("aljazeera", "Remote island volcano erupts as villages are evacuated"),
      article("rfakhmer", "ភ្នំភ្លើងផ្ទុះនៅកោះដាច់ស្រយាល"),
      article("rfakhmer", "ភ្នំភ្លើងផ្ទុះ ភូមិជាច្រើនត្រូវជម្លៀស"),
    ]);
    const volcano = stories.find((s) => s.articles.some((a) => a.title.includes("Volcano")));
    expect(volcano).toBeDefined();
    expect(volcano!.articles.map((a) => a.sourceId).sort()).toEqual(["aljazeera", "bbc"]);
    expect(stories.flatMap((s) => s.articles).some((a) => a.sourceId === "rfakhmer")).toBe(false);
    expect(volcano!.regions).toEqual([]);
    expect(volcano!.keywords).toContain("volcano");
  });

  it("lets unrated outlets alone carry a local story onto the feed", () => {
    const stories = buildStories([
      ...background,
      article("khmertimes", "Phnom Penh opens new Mekong bridge", "The bridge links the capital with Kandal province."),
      article("camboja", "New Mekong bridge opens in Phnom Penh", "The bridge to Kandal province opened on Monday."),
    ]);
    const bridge = stories.find((s) => s.articles.some((a) => a.title.includes("bridge")));
    expect(bridge).toBeDefined();
    expect(bridge!.coverage).toEqual({ left: 0, center: 0, right: 0, total: 0, unrated: 2 });
    expect(bridge!.regions).toEqual(["KH"]);
  });
});

describe("khmer script check", () => {
  it("flags Thai and other scripts mixed into Khmer, but not Latin names", () => {
    expect(hasForeignScript("ហារ\u0E35 ខេន")).toBe(true); // Thai vowel (U+0E35) inside a Khmer word
    expect(hasForeignScript("ហារី ខេន")).toBe(false); // the same word with the Khmer vowel
    expect(hasForeignScript("ผู้นำฟินแลนด์ និងនอร์เวย์")).toBe(true);
    expect(hasForeignScript("ធនាគារកណ្តាលរក្សាអត្រាការប្រាក់ (Federal Reserve) 25%")).toBe(false);
  });

  it("flags Khmer letters touching Latin ones and vowel signs with no consonant", () => {
    expect(looksGarbledKhmer("ការវាយប្រហារតាមអាកាសរបស់ជordanនៅភាគខាងត្បូងស៊ីរី")).toBe(true);
    expect(looksGarbledKhmer("ចេញពីពន្ធនាគាររដ្ឋតennessee តាមរយៈរបង")).toBe(true); // "Tennessee" with a Khmer T
    expect(looksGarbledKhmer("រដ្ឋកាលីហ្វ359័រញ៉ា")).toBe(true); // a vowel sign right after digits
    expect(looksGarbledKhmer("របស់ លោកស្រី ីលហាន អូម៉ា")).toBe(true); // a vowel sign starting a word
    expect(looksGarbledKhmer("នៅ Oleshky ប្រទេសអ៊ុយក្រែន និង SoFi Stadium")).toBe(false); // spaced Latin names
    expect(looksGarbledKhmer("ជ័យ-Z ត្រូវបានប្រកាស")).toBe(false); // hyphenated
    expect(looksGarbledKhmer("© 2026 Freedom News។ ចំណងជើង")).toBe(false); // Khmer full stop after a Latin word
    expect(looksGarbledKhmer("5 ម៉ោង\u200bមុន")).toBe(false); // zero-width space between Khmer words
    expect(looksGarbledKhmer("ជុំទី2ជាមួយលោក")).toBe(false); // digits inside a phrase are normal Khmer typing
    expect(looksGarbledKhmer("អាយុ46ឆ្នាំ")).toBe(false);
    expect(looksGarbledKhmer("ធនាគារកណ្តាល (Federal Reserve) រក្សាអត្រាការប្រាក់ 4.5% ក្នុងឆ្នាំ 2026")).toBe(false);
    expect(looksGarbledKhmer("Anthropic ដាក់ពាក្យចុះបញ្ជីភាគហ៊ុន")).toBe(false);
  });

  it("drops garbled Khmer and keeps the English summary", () => {
    const good = summary({ headlineKm: "ធនាគារកណ្តាលរក្សាអត្រាការប្រាក់", summaryKm: "ធនាគារកណ្តាលបានរក្សាអត្រាការប្រាក់ដដែល។", leftFramingKm: "ស្ថាប័នឆ្វេង", rightFramingKm: null });
    expect(khmerLooksValid(good)).toBe(true);
    expect(sanitizeKhmer(good)).toBe(good);

    const thai = { ...good, summaryKm: "ธนาคารกลาง รក្សាអត្រាការប្រាក់" };
    expect(khmerLooksValid(thai)).toBe(false);
    const cleaned = sanitizeKhmer(thai);
    expect(cleaned.headline).toBe(good.headline);
    expect(cleaned.generated).toBe(true);
    expect(hasKhmer(cleaned)).toBe(false);
    expect("summaryKm" in cleaned).toBe(false);
    expect(cleaned.khmerRetryAfter).toBeUndefined();
    expect(sanitizeKhmer(thai, new Date("2026-10-28T00:00:00Z")).khmerRetryAfter).toBe("2026-10-28T00:00:00.000Z");

    const glued = { ...good, headlineKm: "ការវាយប្រហាររបស់ជordanនៅស៊ីរី" };
    expect(khmerLooksValid(glued)).toBe(false);

    // Khmer fields that are not actually Khmer (the model answered in English) are dropped too.
    expect(khmerLooksValid({ ...good, headlineKm: "Central bank holds rates" })).toBe(false);
    expect(khmerLooksValid(summary())).toBe(false);
  });
});

describe("shouldSummarize", () => {
  it("takes the top stories plus Cambodia-local and blindspot stories", () => {
    expect(shouldSummarize({ regions: [], blindspot: null }, 0, 30)).toBe(true);
    expect(shouldSummarize({ regions: [], blindspot: null }, 30, 30)).toBe(false);
    expect(shouldSummarize({ regions: ["KH"], blindspot: null }, 75, 30)).toBe(true);
    expect(shouldSummarize({ regions: ["US"], blindspot: null }, 75, 30)).toBe(false);
    expect(shouldSummarize({ regions: [], blindspot: "left" }, 75, 30)).toBe(true);
  });
});

describe("localized summary", () => {
  it("uses Khmer when present and falls back to English with a flag", () => {
    const km = summary({ headlineKm: "ធនាគារកណ្តាលរក្សាអត្រាការប្រាក់", summaryKm: "សង្ខេប", leftFramingKm: "ឆ្វេង", rightFramingKm: null });
    expect(localizedSummary(km, "km")).toMatchObject({ headline: "ធនាគារកណ្តាលរក្សាអត្រាការប្រាក់", leftFraming: "ឆ្វេង", rightFraming: null, lang: "km", fallback: false });
    expect(localizedSummary(km, "en")).toMatchObject({ headline: "Central bank holds rates", lang: "en", fallback: false });
    expect(localizedSummary(summary(), "km")).toMatchObject({ headline: "Central bank holds rates", lang: "en", fallback: true });
  });
});

describe("normalizeFeed", () => {
  it("fills in fields missing from snapshots written before categories and regions existed", () => {
    const old = {
      generatedAt: "2026-10-25T00:00:00Z",
      articleCount: 2,
      failedSources: [],
      demo: false,
      stories: [
        {
          id: "old",
          articles: [article("khmertimes", "Phnom Penh floods"), article("bbc", "Floods hit Phnom Penh")],
          coverage: { left: 0, center: 1, right: 0, total: 1 },
          blindspot: null,
          firstSeen: "2026-10-25T00:00:00Z",
          lastUpdated: "2026-10-25T00:00:00Z",
          summary: { headline: "h", summary: "s", leftFraming: null, rightFraming: null, generated: true },
        },
      ],
    };
    const feed = normalizeFeed(old);
    expect(feed.khmerArticles).toEqual([]);
    expect(feed.localArticles).toEqual({});
    // Garbled Khmer stored before the script check is dropped on read.
    const garbled = normalizeFeed({
      ...old,
      stories: [{ ...old.stories[0], summary: { ...old.stories[0].summary, headlineKm: "ហារ\u0E35 ខេន ឈ្នះ", summaryKm: "សេចក្តីសង្ខេប" } }],
    });
    expect(garbled.stories[0].summary.headlineKm).toBeUndefined();
    expect(garbled.stories[0].summary.headline).toBe("h");
    expect(feed.stories[0]).toMatchObject({ category: "world", regions: ["KH"], keywords: [], coverage: { unrated: 0 } });
    // A stored category wins over the classifier.
    const withCategory = normalizeFeed({ ...old, stories: [{ ...old.stories[0], summary: { ...old.stories[0].summary, category: "health" as const } }] });
    expect(withCategory.stories[0].category).toBe("health");
  });
});

describe("search", () => {
  const rates = story({ id: "rates" });
  const floods = story({
    id: "floods",
    category: "world",
    summary: summary({ headline: "Floods displace thousands", summary: "Record rain.", headlineKm: "ទឹកជំនន់បង្ខំឱ្យមនុស្សរាប់ពាន់នាក់ភៀសខ្លួន", summaryKm: "ភ្លៀងធ្លាក់ខ្លាំង" }),
    articles: [article("cnn", "Record rainfall floods coastal region"), article("aljazeera", "Floods displace thousands")],
    keywords: ["floods", "rainfall"],
  });
  const khmer = article("rfakhmer", "តម្លៃសាំងនៅកម្ពុជាឡើងថ្លៃ", "ក្រសួងពាណិជ្ជកម្ម");
  const feed = feedOf([rates, floods], [khmer]);

  it("matches stories and articles in English", () => {
    const r = searchFeed(feed, "floods");
    expect(r.stories.map((s) => s.id)).toEqual(["floods"]);
    expect(r.articles.map((a) => a.sourceId).sort()).toEqual(["aljazeera", "cnn"]);
    expect(searchFeed(feed, "CNN").articles).toHaveLength(1);
    expect(searchFeed(feed, "").stories).toHaveLength(0);
  });

  it("matches Khmer summaries and Khmer-language articles", () => {
    expect(queryTerms("ទឹកជំនន់")).toEqual(["ទឹកជំនន់"]);
    expect(searchFeed(feed, "ទឹកជំនន់").stories.map((s) => s.id)).toEqual(["floods"]);
    expect(searchFeed(feed, "កម្ពុជា").articles.map((a) => a.id)).toEqual([khmer.id]);
  });
});

describe("preferences", () => {
  it("round-trips through the cookie and ignores junk", () => {
    const prefs = { topics: ["business" as const], outlets: ["bbc"] };
    expect(parsePrefs(serializePrefs(prefs))).toEqual(prefs);
    expect(parsePrefs(encodeURIComponent(JSON.stringify({ topics: ["nope", "sports"], outlets: [1, "cnn"] })))).toEqual({ topics: ["sports"], outlets: ["cnn"] });
    expect(parsePrefs("not json")).toEqual({ topics: [], outlets: [] });
    expect(hasPrefs(parsePrefs(undefined))).toBe(false);
  });

  it("ranks followed topics and outlets first and drops the rest", () => {
    const rates = story({ id: "rates" });
    const floods = story({ id: "floods", category: "world", articles: [article("cnn", "Floods"), article("bbc-uk", "Floods in UK")] });
    const sport = story({ id: "sport", category: "sports", articles: [article("fox-sports", "Game"), article("nypost-sports", "Game recap")] });
    const feed = feedOf([rates, floods, sport]);
    expect(personalize(feed, { topics: ["world"], outlets: ["bbc"] }).map((s) => s.id)).toEqual(["floods", "rates"]);
    expect(personalize(feed, { topics: [], outlets: [] })).toEqual([]);
  });
});

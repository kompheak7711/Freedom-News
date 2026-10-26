export type Bias = "left" | "lean-left" | "center" | "lean-right" | "right" | "unrated";

/** The three buckets shown on a coverage bar. */
export type Side = "left" | "center" | "right";

export type Lang = "en" | "km";

export const CATEGORIES = [
  "politics",
  "world",
  "business",
  "technology",
  "science",
  "health",
  "sports",
  "entertainment",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Source {
  id: string;
  name: string;
  feedUrl: string;
  homepage: string;
  bias: Bias;
  country: string;
  /**
   * The outlet a section feed belongs to. Coverage counts distinct outlets, so
   * several feeds of one outlet count once. Defaults to `id`.
   */
  outlet?: string;
  /** Section feeds (business, sport, ...) carry a topic hint for the classifier. */
  topic?: Category;
  /** Feeds that cover one country's domestic news, used by the Local page. */
  region?: string;
  /** Language of the feed's articles. Defaults to English. */
  lang?: Lang;
}

export interface Article {
  id: string;
  sourceId: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string; // ISO 8601
  imageUrl?: string;
}

export interface Coverage {
  left: number;
  center: number;
  right: number;
  /** Rated outlets only; unrated outlets are counted separately. */
  total: number;
  /** Outlets without a bias rating. Missing in snapshots written before ratings had "unrated". */
  unrated?: number;
}

export interface StorySummary {
  headline: string;
  summary: string;
  leftFraming: string | null;
  rightFraming: string | null;
  /** True when written by the LLM, false when built from article text. */
  generated: boolean;
  /** Missing in summaries stored before categories existed. */
  category?: Category;
  /** Khmer versions. Missing when the summary was extractive or stored before Khmer support. */
  headlineKm?: string;
  summaryKm?: string;
  leftFramingKm?: string | null;
  rightFramingKm?: string | null;
}

export interface Story {
  id: string;
  articles: Article[];
  coverage: Coverage;
  /** Set when one side barely covers a story the other side covers heavily. */
  blindspot: Side | null;
  firstSeen: string;
  lastUpdated: string;
  imageUrl?: string;
  summary: StorySummary;
  category: Category;
  /** Country codes this story is local to, from regional feeds and place names. */
  regions: string[];
  /** Most distinctive terms, shown as "similar topics" chips. */
  keywords: string[];
}

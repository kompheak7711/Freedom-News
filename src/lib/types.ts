export type Bias = "left" | "lean-left" | "center" | "lean-right" | "right";

/** The three buckets shown on a coverage bar. */
export type Side = "left" | "center" | "right";

export interface Source {
  id: string;
  name: string;
  feedUrl: string;
  homepage: string;
  bias: Bias;
  country: string;
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
  total: number;
}

export interface StorySummary {
  headline: string;
  summary: string;
  leftFraming: string | null;
  rightFraming: string | null;
  /** True when written by the LLM, false when built from article text. */
  generated: boolean;
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
}

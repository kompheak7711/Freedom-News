import { hasKhmer } from "./summarize";
import type { Lang, StorySummary } from "./types";

export interface LocalizedSummary {
  headline: string;
  summary: string;
  leftFraming: string | null;
  rightFraming: string | null;
  /** The language the text is actually in. */
  lang: Lang;
  /** True when a Khmer reader is seeing English because no Khmer text exists yet. */
  fallback: boolean;
}

/** The summary in the reader's language, or English with `fallback` set. */
export function localizedSummary(summary: StorySummary, locale: string): LocalizedSummary {
  if (locale === "km" && hasKhmer(summary)) {
    return {
      headline: summary.headlineKm!,
      summary: summary.summaryKm!,
      leftFraming: summary.leftFraming ? (summary.leftFramingKm ?? summary.leftFraming) : null,
      rightFraming: summary.rightFraming ? (summary.rightFramingKm ?? summary.rightFraming) : null,
      lang: "km",
      fallback: false,
    };
  }
  return {
    headline: summary.headline,
    summary: summary.summary,
    leftFraming: summary.leftFraming,
    rightFraming: summary.rightFraming,
    lang: "en",
    fallback: locale !== "en",
  };
}

/** Rough reading time in minutes for a block of text. */
export function readingMinutes(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

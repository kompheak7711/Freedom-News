import { getSource } from "./sources";
import type { Article, Lang } from "./types";

const KHMER_CHAR = /[ក-៿]/g;
const LATIN_CHAR = /[A-Za-z]/g;

/** True when a text is mostly written in Khmer script. */
export function isKhmerText(text: string): boolean {
  const khmer = text.match(KHMER_CHAR)?.length ?? 0;
  const latin = text.match(LATIN_CHAR)?.length ?? 0;
  return khmer > 0 && khmer >= latin;
}

/** The language of an article: from its source when known, else from its script. */
export function articleLang(article: Article): Lang {
  const source = getSource(article.sourceId);
  if (source?.lang) return source.lang;
  return isKhmerText(article.title) ? "km" : "en";
}

/**
 * Scripts a model writing Khmer sometimes slips into: Thai and Lao above all,
 * plus Myanmar, Cyrillic, Arabic, the Indic blocks, kana, CJK and Hangul.
 * Latin stays allowed: names and outlets are kept recognisable that way.
 */
const FOREIGN_SCRIPT =
  /[\u0E00-\u0EFF\u1000-\u109F\u0400-\u04FF\u0600-\u06FF\u0900-\u0DFF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/;

/** True when a text meant to be Khmer contains characters from another non-Latin script. */
export function hasForeignScript(text: string): boolean {
  return FOREIGN_SCRIPT.test(text);
}

/**
 * Latin letters wedged inside a Khmer word with no space on either side
 * ("ជordanនៅ") are a corrupted transliteration: real Khmer separates names
 * with spaces or brackets. Digits are not checked this way, since "ជុំទី2ជាមួយ"
 * or "អាយុ46ឆ្នាំ" is ordinary Khmer typing.
 */
const GLUED_LATIN = /[\u1780-\u17FF][A-Za-z]+[\u1780-\u17FF]/;
/**
 * A Khmer dependent vowel or sign (U+17B4-U+17D3) can only follow a Khmer
 * consonant, so one after a digit or Latin letter ("កាលីហ្វ359័រញ៉ា") means
 * characters of a word were replaced.
 */
const SIGN_AFTER_FOREIGN = /[A-Za-z0-9][\u17B4-\u17D3]/;

/** True when Khmer text shows signs of a garbled model output. */
export function looksGarbledKhmer(text: string): boolean {
  return hasForeignScript(text) || GLUED_LATIN.test(text) || SIGN_AFTER_FOREIGN.test(text);
}

let segmenter: Intl.Segmenter | null | undefined;

/**
 * Khmer has no spaces between words, so the English tokenizer cannot split it.
 * Intl.Segmenter uses ICU's dictionary-based word breaker for Khmer.
 */
export function segmentKhmer(text: string): string[] {
  if (segmenter === undefined) {
    segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("km", { granularity: "word" }) : null;
  }
  if (!segmenter) return [text.trim()].filter(Boolean);
  const words: string[] = [];
  for (const part of segmenter.segment(text)) {
    if (part.isWordLike && part.segment.trim().length > 1) words.push(part.segment.trim());
  }
  return words;
}

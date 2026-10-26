import { getSource } from "./sources";
import type { Article } from "./types";

const STOPWORDS = new Set(
  `a about above after again against all also am an and any are as at be because been before being below
  between both but by can could did do does doing down during each few for from further had has have having
  he her here hers him his how i if in into is it its itself just me more most my new news no nor not now of
  off on once only or other our out over own said same says she should so some such than that the their them
  then there these they this those through to too under until up us very was we were what when where which
  while who whom why will with would you your amid after over live update updates latest report reports
  video watch photos analysis opinion`.split(/\s+/),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

type Vector = Map<string, number>;

function articleTokens(a: Article): string[] {
  // Titles carry the strongest signal about which event an article covers,
  // so they count twice.
  return [...tokenize(a.title), ...tokenize(a.title), ...tokenize(a.description)];
}

/**
 * Words an outlet repeats across many of its own articles but other outlets
 * rarely use: show names ("Face the Nation"), feed footers ("appeared first
 * on Breitbart"). They make an outlet's unrelated articles look alike.
 */
function sourceBoilerplate(articles: Article[], docs: string[][], df: Map<string, number>) {
  const bySource = new Map<string, { n: number; df: Map<string, number> }>();
  articles.forEach((a, i) => {
    const entry = bySource.get(a.sourceId) ?? { n: 0, df: new Map<string, number>() };
    entry.n += 1;
    for (const t of new Set(docs[i])) entry.df.set(t, (entry.df.get(t) ?? 0) + 1);
    bySource.set(a.sourceId, entry);
  });
  const boilerplate = new Map<string, Set<string>>();
  for (const [sourceId, { n, df: sourceDf }] of bySource) {
    const words = new Set<string>();
    for (const [t, count] of sourceDf) {
      const ownShare = count / (df.get(t) ?? count);
      if (count >= 3 && count / n >= 0.1 && ownShare >= 0.7) words.add(t);
    }
    boilerplate.set(sourceId, words);
  }
  return boilerplate;
}

export function buildVectors(articles: Article[]): Vector[] {
  const docs = articles.map(articleTokens);
  const df = new Map<string, number>();
  for (const tokens of docs) {
    for (const t of new Set(tokens)) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const boilerplate = sourceBoilerplate(articles, docs, df);
  const n = docs.length;
  return docs.map((allTokens, i) => {
    const skip = boilerplate.get(articles[i].sourceId);
    const tokens = skip?.size ? allTokens.filter((t) => !skip.has(t)) : allTokens;
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    const vec: Vector = new Map();
    let norm = 0;
    for (const [t, count] of tf) {
      const w = (1 + Math.log(count)) * Math.log((n + 1) / ((df.get(t) ?? 0) + 1));
      if (w <= 0) continue;
      vec.set(t, w);
      norm += w * w;
    }
    norm = Math.sqrt(norm) || 1;
    for (const [t, w] of vec) vec.set(t, w / norm);
    return vec;
  });
}

export function cosine(a: Vector, b: Vector): number {
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [t, w] of small) {
    const other = large.get(t);
    if (other) dot += w * other;
  }
  return dot;
}

export interface ClusterOptions {
  /** Minimum similarity between an article and a cluster's centroid to join it. */
  threshold?: number;
  /** An article may also join through a single very similar member. */
  memberThreshold?: number;
  /**
   * Extra similarity required to join a cluster that already has an article
   * from the same outlet. One outlet rarely runs several pieces on one event,
   * so repeats usually mean a broad topic (a TV show, a campaign) not an event.
   */
  sameSourcePenalty?: number;
  /** Minimum centroid similarity for two clusters to be merged afterwards. */
  mergeThreshold?: number;
  /** Articles further apart in time than this never share a cluster. */
  maxSpanHours?: number;
}

/**
 * Groups articles about the same event, single-pass: each article joins the
 * most similar existing cluster above the threshold, or starts a new one.
 * Articles are processed oldest first so clusters grow around the first report.
 * A merge pass then joins clusters that split around the same event.
 */
export function clusterArticles(articles: Article[], options: ClusterOptions = {}): Article[][] {
  const threshold = options.threshold ?? 0.22;
  const memberThreshold = options.memberThreshold ?? 0.4;
  const sameSourcePenalty = options.sameSourcePenalty ?? 0.15;
  const mergeThreshold = options.mergeThreshold ?? 0.28;
  const maxSpanMs = (options.maxSpanHours ?? 48) * 3600 * 1000;

  const order = articles
    .map((a, i) => ({ a, i }))
    .sort((x, y) => x.a.publishedAt.localeCompare(y.a.publishedAt));
  const vectors = buildVectors(articles);

  interface Cluster {
    members: Article[];
    vectors: Vector[];
    centroid: Vector;
    sources: Set<string>;
    start: number;
  }
  const clusters: Cluster[] = [];

  for (const { a, i } of order) {
    const vec = vectors[i];
    const time = Date.parse(a.publishedAt);
    let best: Cluster | null = null;
    let bestMargin = 0;
    for (const c of clusters) {
      if (time - c.start > maxSpanMs) continue;
      const penalty = c.sources.has(a.sourceId) ? sameSourcePenalty : 0;
      const centroidScore = cosine(vec, c.centroid) - threshold - penalty;
      let memberScore = -Infinity;
      for (const member of c.vectors) {
        memberScore = Math.max(memberScore, cosine(vec, member) - memberThreshold - penalty);
      }
      const margin = Math.max(centroidScore, memberScore);
      if (margin >= bestMargin) {
        best = c;
        bestMargin = margin;
      }
    }
    if (best) {
      best.members.push(a);
      best.vectors.push(vec);
      best.sources.add(a.sourceId);
      best.centroid = addToCentroid(best.centroid, vec, best.members.length);
    } else {
      clusters.push({ members: [a], vectors: [vec], centroid: new Map(vec), sources: new Set([a.sourceId]), start: time });
    }
  }

  // An early article can miss the cluster its closest match later joined, so
  // merge clusters whose centroids are similar enough until nothing changes.
  let merged = true;
  while (merged) {
    merged = false;
    for (let x = 0; x < clusters.length; x++) {
      for (let y = x + 1; y < clusters.length; y++) {
        const a = clusters[x];
        const b = clusters[y];
        if (Math.abs(a.start - b.start) > maxSpanMs) continue;
        if (cosine(a.centroid, b.centroid) < mergeThreshold) continue;
        for (const [m, member] of b.members.entries()) {
          a.members.push(member);
          a.vectors.push(b.vectors[m]);
          a.sources.add(member.sourceId);
          a.centroid = addToCentroid(a.centroid, b.vectors[m], a.members.length);
        }
        a.start = Math.min(a.start, b.start);
        clusters.splice(y, 1);
        y -= 1;
        merged = true;
      }
    }
  }

  return clusters.map((c) => c.members);
}

/** Running mean of member vectors, renormalised to unit length. */
function addToCentroid(centroid: Vector, vec: Vector, size: number): Vector {
  const next: Vector = new Map();
  for (const [t, w] of centroid) next.set(t, (w * (size - 1)) / size);
  for (const [t, w] of vec) next.set(t, (next.get(t) ?? 0) + w / size);
  let norm = 0;
  for (const w of next.values()) norm += w * w;
  norm = Math.sqrt(norm) || 1;
  for (const [t, w] of next) next.set(t, w / norm);
  return next;
}

/**
 * The article most similar to the rest of its story (ties go to center
 * outlets, which tend to word things neutrally). Used for the headline.
 */
export function pickLead(articles: Article[]): Article {
  // Plain term counts, not TF-IDF: within one story the shared words are
  // exactly the signal, and IDF over the story would zero them out.
  const vectors = articles.map((a) => {
    const vec: Vector = new Map();
    for (const t of articleTokens(a)) vec.set(t, (vec.get(t) ?? 0) + 1);
    let norm = 0;
    for (const w of vec.values()) norm += w * w;
    norm = Math.sqrt(norm) || 1;
    for (const [t, w] of vec) vec.set(t, w / norm);
    return vec;
  });
  let best = articles[0];
  let bestScore = -Infinity;
  articles.forEach((a, i) => {
    let score = 0;
    vectors.forEach((v, j) => {
      if (i !== j) score += cosine(vectors[i], v);
    });
    if (getSource(a.sourceId)?.bias === "center") score += 0.01;
    if (score > bestScore) {
      best = a;
      bestScore = score;
    }
  });
  return best;
}

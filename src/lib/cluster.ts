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

export function buildVectors(articles: Article[]): Vector[] {
  const docs = articles.map(articleTokens);
  const df = new Map<string, number>();
  for (const tokens of docs) {
    for (const t of new Set(tokens)) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const n = docs.length;
  return docs.map((tokens) => {
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
  /** Minimum similarity between an article and a cluster to join it. */
  threshold?: number;
  /** Articles further apart in time than this never share a cluster. */
  maxSpanHours?: number;
}

/**
 * Groups articles about the same event, single-pass: each article joins the
 * most similar existing cluster above the threshold, or starts a new one.
 * Similarity to a cluster is the higher of its similarity to the centroid and
 * to the closest member, since outlets often word the same event differently.
 * Articles are processed oldest first so clusters grow around the first report.
 */
export function clusterArticles(articles: Article[], options: ClusterOptions = {}): Article[][] {
  const threshold = options.threshold ?? 0.2;
  const maxSpanMs = (options.maxSpanHours ?? 48) * 3600 * 1000;

  const order = articles
    .map((a, i) => ({ a, i }))
    .sort((x, y) => x.a.publishedAt.localeCompare(y.a.publishedAt));
  const vectors = buildVectors(articles);

  interface Cluster {
    members: Article[];
    vectors: Vector[];
    centroid: Vector;
    start: number;
  }
  const clusters: Cluster[] = [];

  for (const { a, i } of order) {
    const vec = vectors[i];
    const time = Date.parse(a.publishedAt);
    let best: Cluster | null = null;
    let bestScore = threshold;
    for (const c of clusters) {
      if (time - c.start > maxSpanMs) continue;
      let score = cosine(vec, c.centroid);
      for (const member of c.vectors) score = Math.max(score, cosine(vec, member));
      if (score >= bestScore) {
        best = c;
        bestScore = score;
      }
    }
    if (best) {
      best.members.push(a);
      best.vectors.push(vec);
      best.centroid = addToCentroid(best.centroid, vec, best.members.length);
    } else {
      clusters.push({ members: [a], vectors: [vec], centroid: new Map(vec), start: time });
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
        if (cosine(a.centroid, b.centroid) < threshold) continue;
        for (const [m, member] of b.members.entries()) {
          a.members.push(member);
          a.vectors.push(b.vectors[m]);
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

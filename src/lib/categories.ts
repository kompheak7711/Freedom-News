import { getSource } from "./sources";
import { CATEGORIES, type Article, type Category } from "./types";

export function isCategory(value: string | undefined | null): value is Category {
  return CATEGORIES.includes(value as Category);
}

/**
 * Keyword lists for the cheap classifier. Multi-word phrases count double
 * because they are rarely ambiguous. "world" is the default for anything that
 * does not match, since every feed is a world-news feed.
 */
const KEYWORDS: Record<Exclude<Category, "world">, string[]> = {
  politics: [
    "election", "elections", "parliament", "senate", "senator", "congress", "congressional", "minister", "ministry",
    "president", "presidential", "prime minister", "vote", "voters", "voting", "ballot", "campaign", "governor",
    "mayor", "lawmakers", "legislation", "democrats", "democrat", "republicans", "republican", "gop", "labour",
    "tories", "conservative party", "coalition", "cabinet", "referendum", "impeachment", "white house", "kremlin",
    "downing street", "opposition", "ruling party", "midterm", "midterms", "poll", "polls", "supreme court",
    "immigration", "border policy", "executive order", "political", "politics", "government shutdown",
  ],
  business: [
    "stocks", "stock market", "shares", "markets", "economy", "economic", "inflation", "tariff", "tariffs", "trade",
    "trade talks", "bank", "banks", "interest rate", "interest rates", "rate cut", "earnings", "profit", "profits",
    "revenue", "ceo", "merger", "acquisition", "ipo", "investors", "investment", "gdp", "exports", "imports",
    "oil prices", "crypto", "bitcoin", "wall street", "startup", "layoffs", "jobs report", "central bank",
    "federal reserve", "ecb", "recession", "business", "company", "companies", "retailer", "airline", "shareholders",
    "wages", "pension", "mortgage", "housing market", "factory", "factories", "manufacturing",
  ],
  technology: [
    "ai", "artificial intelligence", "chatbot", "software", "app", "apps", "apple", "google", "microsoft", "meta",
    "amazon", "openai", "anthropic", "nvidia", "tesla", "smartphone", "iphone", "android", "chip", "chips",
    "semiconductor", "cyberattack", "hackers", "hack", "data breach", "social media", "tiktok", "robot", "robots",
    "algorithm", "cloud computing", "spacex", "starlink", "tech", "technology", "data center", "data centers",
    "streaming service", "video game", "gaming", "electric vehicle", "electric vehicles", "self-driving", "drone",
    "drones", "quantum", "5g", "internet",
  ],
  science: [
    "scientists", "scientist", "study finds", "study", "research", "researchers", "nasa", "space", "rocket",
    "telescope", "asteroid", "climate", "climate change", "emissions", "methane", "carbon", "species", "fossil",
    "dna", "physics", "astronomers", "mars", "moon", "lunar", "probe", "volcano", "geologists", "ocean", "wildlife",
    "conservation", "biodiversity", "nobel", "experiment", "laboratory", "genome", "evolution", "archaeologists",
    "environment", "environmental", "renewable", "solar", "glacier", "coral",
  ],
  health: [
    "health", "hospital", "hospitals", "doctors", "doctor", "patients", "patient", "vaccine", "vaccines", "virus",
    "outbreak", "disease", "cancer", "drug", "drugs", "fda", "world health organization", "mental health", "obesity",
    "pandemic", "medical", "surgery", "diabetes", "measles", "flu", "cholera", "malaria", "dengue", "medicine",
    "nhs", "healthcare", "health care", "covid", "epidemic", "nurses", "clinic", "pharmaceutical", "opioid",
  ],
  sports: [
    "football", "soccer", "nfl", "nba", "mlb", "nhl", "olympic", "olympics", "world cup", "premier league",
    "champions league", "tennis", "golf", "cricket", "rugby", "formula 1", "f1", "grand prix", "coach", "striker",
    "quarterback", "playoffs", "championship", "medal", "marathon", "boxing", "ufc", "athlete", "athletes",
    "tournament", "match", "season opener", "league", "stadium", "goalkeeper", "cyclist", "sprinter", "sea games",
    "angkor wat international half marathon", "kun khmer",
  ],
  entertainment: [
    "film", "films", "movie", "movies", "box office", "actor", "actress", "singer", "album", "concert", "tour dates",
    "netflix", "disney", "hollywood", "oscar", "oscars", "grammy", "grammys", "emmy", "emmys", "celebrity",
    "tv show", "series finale", "streaming", "bafta", "film festival", "music", "band", "rapper", "star wars",
    "marvel", "broadway", "k-pop", "bts", "taylor swift", "director", "premiere", "sequel", "trailer", "novel",
    "author", "bestseller", "theatre", "theater", "museum", "art exhibition",
  ],
};

interface Pattern {
  category: Exclude<Category, "world">;
  regex: RegExp;
  weight: number;
}

const PATTERNS: Pattern[] = (Object.keys(KEYWORDS) as Array<Exclude<Category, "world">>).flatMap((category) =>
  KEYWORDS[category].map((keyword) => ({
    category,
    regex: new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+")}\\b`, "gi"),
    weight: keyword.includes(" ") ? 2 : 1,
  })),
);

export type CategoryScores = Record<Category, number>;

function emptyScores(): CategoryScores {
  return { politics: 0, world: 0, business: 0, technology: 0, science: 0, health: 0, sports: 0, entertainment: 0 };
}

/** Keyword scores for a text. Exported for tests and for the search page. */
export function scoreText(text: string, scores: CategoryScores = emptyScores()): CategoryScores {
  for (const { category, regex, weight } of PATTERNS) {
    const matches = text.match(regex);
    if (matches) scores[category] += matches.length * weight;
  }
  return scores;
}

/** Classifies one text by keywords; null when nothing matched. */
export function classifyText(text: string): Category | null {
  return pickBest(scoreText(text), 1);
}

function pickBest(scores: CategoryScores, minimum: number): Category | null {
  let best: Category | null = null;
  let bestScore = minimum - 1;
  for (const category of CATEGORIES) {
    if (scores[category] > bestScore) {
      best = category;
      bestScore = scores[category];
    }
  }
  return best;
}

/**
 * Classifies a story from its articles. Titles count twice. Articles that came
 * from a section feed (business, sport, ...) add a strong vote for that section,
 * since the outlet already filed them there.
 */
export function classifyStory(articles: Article[]): Category {
  const scores = emptyScores();
  for (const article of articles) {
    scoreText(`${article.title} ${article.title} ${article.description}`, scores);
    const topic = getSource(article.sourceId)?.topic;
    if (topic) scores[topic] += 3;
  }
  // A single stray keyword should not pull a story out of "world".
  const threshold = Math.max(2, Math.ceil(articles.length * 0.75));
  return pickBest(scores, threshold) ?? "world";
}

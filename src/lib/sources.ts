import type { Bias, Side, Source } from "./types";

/**
 * Outlets we pull RSS from, with a bias rating per outlet.
 *
 * Ratings are approximate, based on publicly available media-bias charts
 * (AllSides, Ad Fontes Media). Review them before relying on them, and check
 * each rating provider's licence if you display their ratings commercially.
 */
export const SOURCES: Source[] = [
  // Left / lean left
  { id: "guardian", name: "The Guardian", feedUrl: "https://www.theguardian.com/world/rss", homepage: "https://www.theguardian.com", bias: "lean-left", country: "GB" },
  { id: "cnn", name: "CNN", feedUrl: "http://rss.cnn.com/rss/edition_world.rss", homepage: "https://www.cnn.com", bias: "left", country: "US" },
  { id: "nyt", name: "The New York Times", feedUrl: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", homepage: "https://www.nytimes.com", bias: "lean-left", country: "US" },
  { id: "wapo", name: "The Washington Post", feedUrl: "https://feeds.washingtonpost.com/rss/world", homepage: "https://www.washingtonpost.com", bias: "lean-left", country: "US" },
  { id: "npr", name: "NPR", feedUrl: "https://feeds.npr.org/1004/rss.xml", homepage: "https://www.npr.org", bias: "lean-left", country: "US" },
  { id: "huffpost", name: "HuffPost", feedUrl: "https://www.huffpost.com/section/world-news/feed", homepage: "https://www.huffpost.com", bias: "left", country: "US" },
  { id: "independent", name: "The Independent", feedUrl: "https://www.independent.co.uk/news/world/rss", homepage: "https://www.independent.co.uk", bias: "lean-left", country: "GB" },
  { id: "aljazeera", name: "Al Jazeera", feedUrl: "https://www.aljazeera.com/xml/rss/all.xml", homepage: "https://www.aljazeera.com", bias: "lean-left", country: "QA" },
  { id: "nbc", name: "NBC News", feedUrl: "https://feeds.nbcnews.com/nbcnews/public/world", homepage: "https://www.nbcnews.com", bias: "lean-left", country: "US" },
  { id: "cbs", name: "CBS News", feedUrl: "https://www.cbsnews.com/latest/rss/world", homepage: "https://www.cbsnews.com", bias: "lean-left", country: "US" },
  { id: "abc", name: "ABC News", feedUrl: "https://abcnews.go.com/abcnews/internationalheadlines", homepage: "https://abcnews.go.com", bias: "lean-left", country: "US" },

  // Center
  { id: "bbc", name: "BBC News", feedUrl: "https://feeds.bbci.co.uk/news/world/rss.xml", homepage: "https://www.bbc.com/news", bias: "center", country: "GB" },
  { id: "dw", name: "Deutsche Welle", feedUrl: "https://rss.dw.com/rdf/rss-en-world", homepage: "https://www.dw.com", bias: "center", country: "DE" },
  { id: "france24", name: "France 24", feedUrl: "https://www.france24.com/en/rss", homepage: "https://www.france24.com", bias: "center", country: "FR" },
  { id: "euronews", name: "Euronews", feedUrl: "https://www.euronews.com/rss?format=mrss&level=theme&name=news", homepage: "https://www.euronews.com", bias: "center", country: "FR" },
  { id: "thehill", name: "The Hill", feedUrl: "https://thehill.com/news/feed/", homepage: "https://thehill.com", bias: "center", country: "US" },
  { id: "cnbc", name: "CNBC", feedUrl: "https://www.cnbc.com/id/100727362/device/rss/rss.html", homepage: "https://www.cnbc.com", bias: "center", country: "US" },
  { id: "wsj", name: "The Wall Street Journal", feedUrl: "https://feeds.a.dj.com/rss/RSSWorldNews.xml", homepage: "https://www.wsj.com", bias: "center", country: "US" },
  { id: "newsweek", name: "Newsweek", feedUrl: "https://www.newsweek.com/rss", homepage: "https://www.newsweek.com", bias: "center", country: "US" },
  { id: "scmp", name: "South China Morning Post", feedUrl: "https://www.scmp.com/rss/91/feed", homepage: "https://www.scmp.com", bias: "center", country: "HK" },
  { id: "toi", name: "The Times of India", feedUrl: "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms", homepage: "https://timesofindia.indiatimes.com", bias: "center", country: "IN" },
  { id: "japantimes", name: "The Japan Times", feedUrl: "https://www.japantimes.co.jp/feed/", homepage: "https://www.japantimes.co.jp", bias: "center", country: "JP" },
  { id: "abcau", name: "ABC News (Australia)", feedUrl: "https://www.abc.net.au/news/feed/51120/rss.xml", homepage: "https://www.abc.net.au/news", bias: "center", country: "AU" },

  // Right / lean right
  { id: "fox", name: "Fox News", feedUrl: "https://moxie.foxnews.com/google-publisher/world.xml", homepage: "https://www.foxnews.com", bias: "right", country: "US" },
  { id: "nypost", name: "New York Post", feedUrl: "https://nypost.com/news/feed/", homepage: "https://nypost.com", bias: "lean-right", country: "US" },
  { id: "washtimes", name: "The Washington Times", feedUrl: "https://www.washingtontimes.com/rss/headlines/news/world/", homepage: "https://www.washingtontimes.com", bias: "lean-right", country: "US" },
  { id: "washexaminer", name: "Washington Examiner", feedUrl: "https://www.washingtonexaminer.com/feed", homepage: "https://www.washingtonexaminer.com", bias: "lean-right", country: "US" },
  { id: "dailymail", name: "Daily Mail", feedUrl: "https://www.dailymail.co.uk/news/worldnews/index.rss", homepage: "https://www.dailymail.co.uk", bias: "right", country: "GB" },
  { id: "telegraph", name: "The Telegraph", feedUrl: "https://www.telegraph.co.uk/rss.xml", homepage: "https://www.telegraph.co.uk", bias: "lean-right", country: "GB" },
  { id: "spectator", name: "The Spectator", feedUrl: "https://www.spectator.co.uk/feed", homepage: "https://www.spectator.co.uk", bias: "lean-right", country: "GB" },
  { id: "nationalreview", name: "National Review", feedUrl: "https://www.nationalreview.com/feed/", homepage: "https://www.nationalreview.com", bias: "right", country: "US" },
  { id: "federalist", name: "The Federalist", feedUrl: "https://thefederalist.com/feed/", homepage: "https://thefederalist.com", bias: "right", country: "US" },
  { id: "dailywire", name: "The Daily Wire", feedUrl: "https://www.dailywire.com/feeds/rss.xml", homepage: "https://www.dailywire.com", bias: "right", country: "US" },
  { id: "dailycaller", name: "The Daily Caller", feedUrl: "https://dailycaller.com/feed/", homepage: "https://dailycaller.com", bias: "right", country: "US" },
  { id: "breitbart", name: "Breitbart", feedUrl: "https://feeds.feedburner.com/breitbart", homepage: "https://www.breitbart.com", bias: "right", country: "US" },
];

const BY_ID = new Map(SOURCES.map((s) => [s.id, s]));

export function getSource(id: string): Source | undefined {
  return BY_ID.get(id);
}

export function sideOf(bias: Bias): Side {
  if (bias === "left" || bias === "lean-left") return "left";
  if (bias === "right" || bias === "lean-right") return "right";
  return "center";
}

export const BIAS_LABEL: Record<Bias, string> = {
  left: "Left",
  "lean-left": "Lean Left",
  center: "Center",
  "lean-right": "Lean Right",
  right: "Right",
};

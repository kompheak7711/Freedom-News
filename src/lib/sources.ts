import type { Bias, Side, Source } from "./types";

/**
 * Outlets we pull RSS from, with a bias rating per outlet.
 *
 * Ratings are approximate, based on publicly available media-bias charts
 * (AllSides, Ad Fontes Media). Review them before relying on them, and check
 * each rating provider's licence if you display their ratings commercially.
 *
 * Outlets those charts do not cover (the Cambodian outlets below) are "unrated":
 * they appear in stories and on the Local page but never in the left/center/right
 * coverage maths. We do not invent ratings.
 */
const WORLD_FEEDS: Source[] = [
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

/**
 * Cambodian outlets, for the Local page and the Khmer edition. No public
 * left/right chart rates them, so they are "unrated". Feed URLs were checked on
 * 2026-10-26. Khmer-language feeds (lang "km") are listed on the Local page but
 * kept out of the English-only clusterer.
 */
const CAMBODIA_FEEDS: Source[] = [
  { id: "khmertimes", name: "Khmer Times", feedUrl: "https://www.khmertimeskh.com/feed/", homepage: "https://www.khmertimeskh.com", bias: "unrated", country: "KH", region: "KH" },
  { id: "phnompenhpost", name: "The Phnom Penh Post", feedUrl: "https://www.phnompenhpost.com/feed/", homepage: "https://www.phnompenhpost.com", bias: "unrated", country: "KH", region: "KH" },
  { id: "camboja", name: "CamboJA News", feedUrl: "https://cambojanews.com/feed/", homepage: "https://cambojanews.com", bias: "unrated", country: "KH", region: "KH" },
  { id: "rfakhmer", name: "RFA Khmer", feedUrl: "https://www.rfa.org/khmer/rss2.xml", homepage: "https://www.rfa.org/khmer/", bias: "unrated", country: "KH", region: "KH", lang: "km" },
];

/**
 * Section and country feeds of outlets already rated above. Each feed keeps the
 * outlet's rating and points at the outlet with `outlet`, so coverage counts the
 * outlet once however many of its feeds carried a story. `topic` feeds give the
 * category classifier a strong hint; `region` feeds mark stories as local.
 * Checked on 2026-10-26 except the NYT section feeds (that network could not
 * reach rss.nytimes.com); a failing feed is skipped by ingest, never fatal.
 * Telegraph and WSJ section feeds were left out because they are stale.
 */
const SECTION_FEEDS: Source[] = [
  { id: "bbc-business", outlet: "bbc", name: "BBC News", feedUrl: "https://feeds.bbci.co.uk/news/business/rss.xml", homepage: "https://www.bbc.com/news", bias: "center", country: "GB", topic: "business" },
  { id: "bbc-technology", outlet: "bbc", name: "BBC News", feedUrl: "https://feeds.bbci.co.uk/news/technology/rss.xml", homepage: "https://www.bbc.com/news", bias: "center", country: "GB", topic: "technology" },
  { id: "bbc-science", outlet: "bbc", name: "BBC News", feedUrl: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", homepage: "https://www.bbc.com/news", bias: "center", country: "GB", topic: "science" },
  { id: "bbc-health", outlet: "bbc", name: "BBC News", feedUrl: "https://feeds.bbci.co.uk/news/health/rss.xml", homepage: "https://www.bbc.com/news", bias: "center", country: "GB", topic: "health" },
  { id: "bbc-politics", outlet: "bbc", name: "BBC News", feedUrl: "https://feeds.bbci.co.uk/news/politics/rss.xml", homepage: "https://www.bbc.com/news", bias: "center", country: "GB", topic: "politics" },
  { id: "bbc-entertainment", outlet: "bbc", name: "BBC News", feedUrl: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", homepage: "https://www.bbc.com/news", bias: "center", country: "GB", topic: "entertainment" },
  { id: "bbc-sports", outlet: "bbc", name: "BBC News", feedUrl: "https://feeds.bbci.co.uk/sport/rss.xml", homepage: "https://www.bbc.com/news", bias: "center", country: "GB", topic: "sports" },
  { id: "bbc-uk", outlet: "bbc", name: "BBC News", feedUrl: "https://feeds.bbci.co.uk/news/uk/rss.xml", homepage: "https://www.bbc.com/news", bias: "center", country: "GB", region: "GB" },
  { id: "guardian-business", outlet: "guardian", name: "The Guardian", feedUrl: "https://www.theguardian.com/uk/business/rss", homepage: "https://www.theguardian.com", bias: "lean-left", country: "GB", topic: "business" },
  { id: "guardian-technology", outlet: "guardian", name: "The Guardian", feedUrl: "https://www.theguardian.com/uk/technology/rss", homepage: "https://www.theguardian.com", bias: "lean-left", country: "GB", topic: "technology" },
  { id: "guardian-science", outlet: "guardian", name: "The Guardian", feedUrl: "https://www.theguardian.com/science/rss", homepage: "https://www.theguardian.com", bias: "lean-left", country: "GB", topic: "science" },
  { id: "guardian-sports", outlet: "guardian", name: "The Guardian", feedUrl: "https://www.theguardian.com/uk/sport/rss", homepage: "https://www.theguardian.com", bias: "lean-left", country: "GB", topic: "sports" },
  { id: "guardian-politics", outlet: "guardian", name: "The Guardian", feedUrl: "https://www.theguardian.com/politics/rss", homepage: "https://www.theguardian.com", bias: "lean-left", country: "GB", topic: "politics" },
  { id: "guardian-entertainment", outlet: "guardian", name: "The Guardian", feedUrl: "https://www.theguardian.com/uk/culture/rss", homepage: "https://www.theguardian.com", bias: "lean-left", country: "GB", topic: "entertainment" },
  { id: "guardian-us", outlet: "guardian", name: "The Guardian", feedUrl: "https://www.theguardian.com/us-news/rss", homepage: "https://www.theguardian.com", bias: "lean-left", country: "GB", region: "US" },
  { id: "nyt-business", outlet: "nyt", name: "The New York Times", feedUrl: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml", homepage: "https://www.nytimes.com", bias: "lean-left", country: "US", topic: "business" },
  { id: "nyt-technology", outlet: "nyt", name: "The New York Times", feedUrl: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml", homepage: "https://www.nytimes.com", bias: "lean-left", country: "US", topic: "technology" },
  { id: "nyt-science", outlet: "nyt", name: "The New York Times", feedUrl: "https://rss.nytimes.com/services/xml/rss/nyt/Science.xml", homepage: "https://www.nytimes.com", bias: "lean-left", country: "US", topic: "science" },
  { id: "nyt-health", outlet: "nyt", name: "The New York Times", feedUrl: "https://rss.nytimes.com/services/xml/rss/nyt/Health.xml", homepage: "https://www.nytimes.com", bias: "lean-left", country: "US", topic: "health" },
  { id: "nyt-sports", outlet: "nyt", name: "The New York Times", feedUrl: "https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml", homepage: "https://www.nytimes.com", bias: "lean-left", country: "US", topic: "sports" },
  { id: "nyt-politics", outlet: "nyt", name: "The New York Times", feedUrl: "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml", homepage: "https://www.nytimes.com", bias: "lean-left", country: "US", topic: "politics" },
  { id: "nyt-us", outlet: "nyt", name: "The New York Times", feedUrl: "https://rss.nytimes.com/services/xml/rss/nyt/US.xml", homepage: "https://www.nytimes.com", bias: "lean-left", country: "US", region: "US" },
  { id: "cnbc-business", outlet: "cnbc", name: "CNBC", feedUrl: "https://www.cnbc.com/id/10001147/device/rss/rss.html", homepage: "https://www.cnbc.com", bias: "center", country: "US", topic: "business" },
  { id: "cnbc-technology", outlet: "cnbc", name: "CNBC", feedUrl: "https://www.cnbc.com/id/19854910/device/rss/rss.html", homepage: "https://www.cnbc.com", bias: "center", country: "US", topic: "technology" },
  { id: "cnbc-politics", outlet: "cnbc", name: "CNBC", feedUrl: "https://www.cnbc.com/id/10000113/device/rss/rss.html", homepage: "https://www.cnbc.com", bias: "center", country: "US", topic: "politics" },
  { id: "cnbc-health", outlet: "cnbc", name: "CNBC", feedUrl: "https://www.cnbc.com/id/10000108/device/rss/rss.html", homepage: "https://www.cnbc.com", bias: "center", country: "US", topic: "health" },
  { id: "fox-politics", outlet: "fox", name: "Fox News", feedUrl: "https://moxie.foxnews.com/google-publisher/politics.xml", homepage: "https://www.foxnews.com", bias: "right", country: "US", topic: "politics" },
  { id: "fox-science", outlet: "fox", name: "Fox News", feedUrl: "https://moxie.foxnews.com/google-publisher/science.xml", homepage: "https://www.foxnews.com", bias: "right", country: "US", topic: "science" },
  { id: "fox-technology", outlet: "fox", name: "Fox News", feedUrl: "https://moxie.foxnews.com/google-publisher/tech.xml", homepage: "https://www.foxnews.com", bias: "right", country: "US", topic: "technology" },
  { id: "fox-health", outlet: "fox", name: "Fox News", feedUrl: "https://moxie.foxnews.com/google-publisher/health.xml", homepage: "https://www.foxnews.com", bias: "right", country: "US", topic: "health" },
  { id: "fox-sports", outlet: "fox", name: "Fox News", feedUrl: "https://moxie.foxnews.com/google-publisher/sports.xml", homepage: "https://www.foxnews.com", bias: "right", country: "US", topic: "sports" },
  { id: "fox-entertainment", outlet: "fox", name: "Fox News", feedUrl: "https://moxie.foxnews.com/google-publisher/entertainment.xml", homepage: "https://www.foxnews.com", bias: "right", country: "US", topic: "entertainment" },
  { id: "fox-us", outlet: "fox", name: "Fox News", feedUrl: "https://moxie.foxnews.com/google-publisher/us.xml", homepage: "https://www.foxnews.com", bias: "right", country: "US", region: "US" },
  { id: "npr-politics", outlet: "npr", name: "NPR", feedUrl: "https://feeds.npr.org/1014/rss.xml", homepage: "https://www.npr.org", bias: "lean-left", country: "US", topic: "politics" },
  { id: "npr-business", outlet: "npr", name: "NPR", feedUrl: "https://feeds.npr.org/1006/rss.xml", homepage: "https://www.npr.org", bias: "lean-left", country: "US", topic: "business" },
  { id: "npr-science", outlet: "npr", name: "NPR", feedUrl: "https://feeds.npr.org/1007/rss.xml", homepage: "https://www.npr.org", bias: "lean-left", country: "US", topic: "science" },
  { id: "npr-health", outlet: "npr", name: "NPR", feedUrl: "https://feeds.npr.org/1128/rss.xml", homepage: "https://www.npr.org", bias: "lean-left", country: "US", topic: "health" },
  { id: "npr-technology", outlet: "npr", name: "NPR", feedUrl: "https://feeds.npr.org/1019/rss.xml", homepage: "https://www.npr.org", bias: "lean-left", country: "US", topic: "technology" },
  { id: "npr-us", outlet: "npr", name: "NPR", feedUrl: "https://feeds.npr.org/1003/rss.xml", homepage: "https://www.npr.org", bias: "lean-left", country: "US", region: "US" },
  { id: "nypost-business", outlet: "nypost", name: "New York Post", feedUrl: "https://nypost.com/business/feed/", homepage: "https://nypost.com", bias: "lean-right", country: "US", topic: "business" },
  { id: "nypost-sports", outlet: "nypost", name: "New York Post", feedUrl: "https://nypost.com/sports/feed/", homepage: "https://nypost.com", bias: "lean-right", country: "US", topic: "sports" },
  { id: "nypost-technology", outlet: "nypost", name: "New York Post", feedUrl: "https://nypost.com/tech/feed/", homepage: "https://nypost.com", bias: "lean-right", country: "US", topic: "technology" },
  { id: "nypost-entertainment", outlet: "nypost", name: "New York Post", feedUrl: "https://nypost.com/entertainment/feed/", homepage: "https://nypost.com", bias: "lean-right", country: "US", topic: "entertainment" },
  { id: "nypost-politics", outlet: "nypost", name: "New York Post", feedUrl: "https://nypost.com/politics/feed/", homepage: "https://nypost.com", bias: "lean-right", country: "US", topic: "politics" },
  { id: "nypost-us", outlet: "nypost", name: "New York Post", feedUrl: "https://nypost.com/us-news/feed/", homepage: "https://nypost.com", bias: "lean-right", country: "US", region: "US" },
  { id: "cbs-politics", outlet: "cbs", name: "CBS News", feedUrl: "https://www.cbsnews.com/latest/rss/politics", homepage: "https://www.cbsnews.com", bias: "lean-left", country: "US", topic: "politics" },
  { id: "cbs-technology", outlet: "cbs", name: "CBS News", feedUrl: "https://www.cbsnews.com/latest/rss/technology", homepage: "https://www.cbsnews.com", bias: "lean-left", country: "US", topic: "technology" },
  { id: "cbs-science", outlet: "cbs", name: "CBS News", feedUrl: "https://www.cbsnews.com/latest/rss/science", homepage: "https://www.cbsnews.com", bias: "lean-left", country: "US", topic: "science" },
  { id: "cbs-health", outlet: "cbs", name: "CBS News", feedUrl: "https://www.cbsnews.com/latest/rss/health", homepage: "https://www.cbsnews.com", bias: "lean-left", country: "US", topic: "health" },
  { id: "cbs-entertainment", outlet: "cbs", name: "CBS News", feedUrl: "https://www.cbsnews.com/latest/rss/entertainment", homepage: "https://www.cbsnews.com", bias: "lean-left", country: "US", topic: "entertainment" },
  { id: "cbs-business", outlet: "cbs", name: "CBS News", feedUrl: "https://www.cbsnews.com/latest/rss/moneywatch", homepage: "https://www.cbsnews.com", bias: "lean-left", country: "US", topic: "business" },
  { id: "cbs-us", outlet: "cbs", name: "CBS News", feedUrl: "https://www.cbsnews.com/latest/rss/us", homepage: "https://www.cbsnews.com", bias: "lean-left", country: "US", region: "US" },
  { id: "nbc-politics", outlet: "nbc", name: "NBC News", feedUrl: "https://feeds.nbcnews.com/nbcnews/public/politics", homepage: "https://www.nbcnews.com", bias: "lean-left", country: "US", topic: "politics" },
  { id: "nbc-business", outlet: "nbc", name: "NBC News", feedUrl: "https://feeds.nbcnews.com/nbcnews/public/business", homepage: "https://www.nbcnews.com", bias: "lean-left", country: "US", topic: "business" },
  { id: "nbc-health", outlet: "nbc", name: "NBC News", feedUrl: "https://feeds.nbcnews.com/nbcnews/public/health", homepage: "https://www.nbcnews.com", bias: "lean-left", country: "US", topic: "health" },
  { id: "nbc-science", outlet: "nbc", name: "NBC News", feedUrl: "https://feeds.nbcnews.com/nbcnews/public/science", homepage: "https://www.nbcnews.com", bias: "lean-left", country: "US", topic: "science" },
  { id: "nbc-technology", outlet: "nbc", name: "NBC News", feedUrl: "https://feeds.nbcnews.com/nbcnews/public/tech", homepage: "https://www.nbcnews.com", bias: "lean-left", country: "US", topic: "technology" },
  { id: "nbc-us", outlet: "nbc", name: "NBC News", feedUrl: "https://feeds.nbcnews.com/nbcnews/public/news", homepage: "https://www.nbcnews.com", bias: "lean-left", country: "US", region: "US" },
  { id: "abc-politics", outlet: "abc", name: "ABC News", feedUrl: "https://abcnews.go.com/abcnews/politicsheadlines", homepage: "https://abcnews.go.com", bias: "lean-left", country: "US", topic: "politics" },
  { id: "abc-business", outlet: "abc", name: "ABC News", feedUrl: "https://abcnews.go.com/abcnews/businessheadlines", homepage: "https://abcnews.go.com", bias: "lean-left", country: "US", topic: "business" },
  { id: "abc-technology", outlet: "abc", name: "ABC News", feedUrl: "https://abcnews.go.com/abcnews/technologyheadlines", homepage: "https://abcnews.go.com", bias: "lean-left", country: "US", topic: "technology" },
  { id: "abc-health", outlet: "abc", name: "ABC News", feedUrl: "https://abcnews.go.com/abcnews/healthheadlines", homepage: "https://abcnews.go.com", bias: "lean-left", country: "US", topic: "health" },
  { id: "abc-sports", outlet: "abc", name: "ABC News", feedUrl: "https://abcnews.go.com/abcnews/sportsheadlines", homepage: "https://abcnews.go.com", bias: "lean-left", country: "US", topic: "sports" },
  { id: "abc-entertainment", outlet: "abc", name: "ABC News", feedUrl: "https://abcnews.go.com/abcnews/entertainmentheadlines", homepage: "https://abcnews.go.com", bias: "lean-left", country: "US", topic: "entertainment" },
  { id: "abc-us", outlet: "abc", name: "ABC News", feedUrl: "https://abcnews.go.com/abcnews/usheadlines", homepage: "https://abcnews.go.com", bias: "lean-left", country: "US", region: "US" },
  { id: "dailymail-technology", outlet: "dailymail", name: "Daily Mail", feedUrl: "https://www.dailymail.co.uk/sciencetech/index.rss", homepage: "https://www.dailymail.co.uk", bias: "right", country: "GB", topic: "technology" },
  { id: "dailymail-health", outlet: "dailymail", name: "Daily Mail", feedUrl: "https://www.dailymail.co.uk/health/index.rss", homepage: "https://www.dailymail.co.uk", bias: "right", country: "GB", topic: "health" },
  { id: "dailymail-sports", outlet: "dailymail", name: "Daily Mail", feedUrl: "https://www.dailymail.co.uk/sport/index.rss", homepage: "https://www.dailymail.co.uk", bias: "right", country: "GB", topic: "sports" },
  { id: "dailymail-business", outlet: "dailymail", name: "Daily Mail", feedUrl: "https://www.dailymail.co.uk/money/index.rss", homepage: "https://www.dailymail.co.uk", bias: "right", country: "GB", topic: "business" },
  { id: "dailymail-entertainment", outlet: "dailymail", name: "Daily Mail", feedUrl: "https://www.dailymail.co.uk/tvshowbiz/index.rss", homepage: "https://www.dailymail.co.uk", bias: "right", country: "GB", topic: "entertainment" },
  { id: "dailymail-uk", outlet: "dailymail", name: "Daily Mail", feedUrl: "https://www.dailymail.co.uk/news/index.rss", homepage: "https://www.dailymail.co.uk", bias: "right", country: "GB", region: "GB" },
  { id: "independent-business", outlet: "independent", name: "The Independent", feedUrl: "https://www.independent.co.uk/news/business/rss", homepage: "https://www.independent.co.uk", bias: "lean-left", country: "GB", topic: "business" },
  { id: "independent-technology", outlet: "independent", name: "The Independent", feedUrl: "https://www.independent.co.uk/tech/rss", homepage: "https://www.independent.co.uk", bias: "lean-left", country: "GB", topic: "technology" },
  { id: "independent-sports", outlet: "independent", name: "The Independent", feedUrl: "https://www.independent.co.uk/sport/rss", homepage: "https://www.independent.co.uk", bias: "lean-left", country: "GB", topic: "sports" },
  { id: "independent-uk", outlet: "independent", name: "The Independent", feedUrl: "https://www.independent.co.uk/news/uk/rss", homepage: "https://www.independent.co.uk", bias: "lean-left", country: "GB", region: "GB" },
  { id: "washtimes-politics", outlet: "washtimes", name: "The Washington Times", feedUrl: "https://www.washingtontimes.com/rss/headlines/news/politics/", homepage: "https://www.washingtontimes.com", bias: "lean-right", country: "US", topic: "politics" },
  { id: "washtimes-business", outlet: "washtimes", name: "The Washington Times", feedUrl: "https://www.washingtontimes.com/rss/headlines/news/business-economy/", homepage: "https://www.washingtontimes.com", bias: "lean-right", country: "US", topic: "business" },
  { id: "washtimes-sports", outlet: "washtimes", name: "The Washington Times", feedUrl: "https://www.washingtontimes.com/rss/headlines/sports/", homepage: "https://www.washingtontimes.com", bias: "lean-right", country: "US", topic: "sports" },
  { id: "huffpost-politics", outlet: "huffpost", name: "HuffPost", feedUrl: "https://www.huffpost.com/section/politics/feed", homepage: "https://www.huffpost.com", bias: "left", country: "US", topic: "politics" },
  { id: "huffpost-entertainment", outlet: "huffpost", name: "HuffPost", feedUrl: "https://www.huffpost.com/section/entertainment/feed", homepage: "https://www.huffpost.com", bias: "left", country: "US", topic: "entertainment" },
  { id: "huffpost-us", outlet: "huffpost", name: "HuffPost", feedUrl: "https://www.huffpost.com/section/us-news/feed", homepage: "https://www.huffpost.com", bias: "left", country: "US", region: "US" },
  { id: "abcau-au", outlet: "abcau", name: "ABC News (Australia)", feedUrl: "https://www.abc.net.au/news/feed/45910/rss.xml", homepage: "https://www.abc.net.au/news", bias: "center", country: "AU", region: "AU" },
  { id: "abcau-business", outlet: "abcau", name: "ABC News (Australia)", feedUrl: "https://www.abc.net.au/news/feed/51892/rss.xml", homepage: "https://www.abc.net.au/news", bias: "center", country: "AU", topic: "business" },
  { id: "abcau-sports", outlet: "abcau", name: "ABC News (Australia)", feedUrl: "https://www.abc.net.au/news/feed/45924/rss.xml", homepage: "https://www.abc.net.au/news", bias: "center", country: "AU", topic: "sports" },
  { id: "toi-in", outlet: "toi", name: "The Times of India", feedUrl: "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms", homepage: "https://timesofindia.indiatimes.com", bias: "center", country: "IN", region: "IN" },
  { id: "toi-business", outlet: "toi", name: "The Times of India", feedUrl: "https://timesofindia.indiatimes.com/rssfeeds/1898055.cms", homepage: "https://timesofindia.indiatimes.com", bias: "center", country: "IN", topic: "business" },
  { id: "toi-sports", outlet: "toi", name: "The Times of India", feedUrl: "https://timesofindia.indiatimes.com/rssfeeds/4719148.cms", homepage: "https://timesofindia.indiatimes.com", bias: "center", country: "IN", topic: "sports" },
  { id: "thehill-politics", outlet: "thehill", name: "The Hill", feedUrl: "https://thehill.com/homenews/feed/", homepage: "https://thehill.com", bias: "center", country: "US", topic: "politics" },
  { id: "thehill-business", outlet: "thehill", name: "The Hill", feedUrl: "https://thehill.com/business/feed/", homepage: "https://thehill.com", bias: "center", country: "US", topic: "business" },
  { id: "khmertimes-sports", outlet: "khmertimes", name: "Khmer Times", feedUrl: "https://www.khmertimeskh.com/category/sports/feed/", homepage: "https://www.khmertimeskh.com", bias: "unrated", country: "KH", topic: "sports", region: "KH" },
];

export const SOURCES: Source[] = [...WORLD_FEEDS, ...CAMBODIA_FEEDS, ...SECTION_FEEDS];

const BY_ID = new Map(SOURCES.map((s) => [s.id, s]));

export function getSource(id: string): Source | undefined {
  return BY_ID.get(id);
}

/** The outlet a feed belongs to; several feeds of one outlet count once in coverage. */
export function outletOf(source: Source): string {
  return source.outlet ?? source.id;
}

/** One entry per outlet (the main feed), for the Sources page and For You. */
export const OUTLETS: Source[] = SOURCES.filter((s) => !s.outlet);

export function getOutlet(id: string): Source | undefined {
  return OUTLETS.find((s) => s.id === id);
}

/** The coverage bucket of a rating, or null for outlets without one. */
export function sideOf(bias: Bias): Side | null {
  if (bias === "left" || bias === "lean-left") return "left";
  if (bias === "right" || bias === "lean-right") return "right";
  if (bias === "center") return "center";
  return null;
}

/** English labels, used in the LLM prompt. The UI translates ratings via messages. */
export const BIAS_LABEL: Record<Bias, string> = {
  left: "Left",
  "lean-left": "Lean Left",
  center: "Center",
  "lean-right": "Lean Right",
  right: "Right",
  unrated: "Not rated",
};


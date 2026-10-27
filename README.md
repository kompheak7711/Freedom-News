# Freedom News

A Ground News-style news aggregator in English and Khmer (ខ្មែរ).

Collects news from RSS feeds, groups articles about the same event into stories,
summarizes each story with Claude in both languages, and shows how much coverage came
from left, center, and right outlets. It also flags **blindspots**: stories one side of
the spectrum barely covered.

Live: https://freedom-news-kh.vercel.app

## Pages

Every page lives under a locale prefix (`/en/...` or `/km/...`). A visit to `/` is redirected
to the language remembered in the `NEXT_LOCALE` cookie, else to the browser's language, and
visitors in Cambodia (Vercel's `x-vercel-ip-country` header) default to Khmer.

| Page | What it shows |
| --- | --- |
| `/` | Top story, Daily Briefing, Top News list, latest stories, a Blindspot strip and "More in …" rows per section. |
| `/category/[slug]` | Stories in one section: politics, world, business, technology, science, health, sports, entertainment. |
| `/blindspot` | Stories split into "Blindspot for the Left" and "Blindspot for the Right" (`?side=left\|right`). |
| `/story/[id]` | Summary with Left / Center / Right framing tabs, coverage details, bias distribution, the outlet list with ratings, similar topics. Factuality and ownership are marked "coming soon"; we do not invent ratings. |
| `/local` | Stories local to a country (Cambodia, US, UK, Australia, India), plus the latest reports from outlets based there that no other outlet has covered (a story needs two outlets). For Cambodia it also lists recent Khmer-language reports. Location comes from the `fn_location` cookie, else the visitor's IP country. |
| `/for-you` | Stories from followed topics and outlets. Follows live in the `fn_prefs` cookie on this device; accounts are a follow-up. |
| `/sources` | Every outlet with its country, language, feed count and bias rating. |
| `/search` | Searches headlines, summaries (English and Khmer), outlet names and, with a database, every stored article. |

`/api/cron/refresh` is unchanged: `Authorization: Bearer $CRON_SECRET` runs the pipeline
and revalidates the pages. The locale middleware skips `/api`.

## Languages

UI strings live in `messages/en.json` and `messages/km.json` (next-intl). Dates, relative
times and numbers are formatted with `Intl` for `en` or `km-KH`. Khmer pages set
`<html lang="km">`, use the Kantumruy Pro web font and taller line heights, since Khmer
stacks subscript consonants and gets clipped by tight leading.

Story summaries, headlines and framings are written in both languages by one Claude call.
When a story has no Khmer text yet (extractive fallback, no API key, or a summary stored
before Khmer support), the Khmer edition shows the English text with a "Khmer translation
not available yet" note, and stories summarized before Khmer existed are rewritten on the
next refresh. Article titles and outlet names stay in their original language.

## How it works

| Step | File | What it does |
| --- | --- | --- |
| Collect | `src/lib/ingest.ts` | Fetches ~130 feeds (39 outlets) in parallel, keeps the last 48h, 40 newest items per feed, de-duplicates. |
| Rate | `src/lib/sources.ts` | One bias rating per outlet (Left to Right), approximated from AllSides / Ad Fontes. Section feeds (`topic`) and country feeds (`region`) point at their outlet. Cambodian outlets are `unrated`. |
| Group | `src/lib/cluster.ts` | TF-IDF vectors of title + description, single-pass clustering plus a merge pass. English only; Khmer-language articles are listed separately. |
| Classify | `src/lib/categories.ts`, `src/lib/regions.ts` | Keyword classifier plus section-feed hints gives every story a category; country feeds and place names give it `regions`. Claude's category wins when available. |
| Measure | `src/lib/coverage.ts` | Counts distinct outlets per side (several feeds of one outlet count once), keeps unrated outlets out of the percentages, detects blindspots. |
| Summarize | `src/lib/summarize.ts` | Claude writes a neutral headline, summary, left/right framing, the category, and Khmer versions of all text in one structured call. |
| Store | `src/lib/db.ts` | Postgres keeps articles, per-story summaries (jsonb, new fields optional), and the latest feed snapshot. |
| Serve | `src/lib/stories.ts`, `src/app/[locale]/` | Pages read the latest snapshot; `/api/cron/refresh` rebuilds it every 30 min. |

Per refresh, the top `MAX_STORIES` (30) stories, every story local to Cambodia and every
blindspot get a Claude summary; the rest of the `MAX_FEED_STORIES` (80) get an extractive
one, so category pages have depth at a bounded cost. Khmer text that strays into another
script (the model occasionally mixes in Thai) is retried once and otherwise dropped, so the
site shows English with a note rather than garbled Khmer. Summaries are reused until a story grows by half. Calls stop after 200s so a refresh
fits the 300s route limit. Old snapshots and summaries without the new fields still load.

## Sources

39 outlets, ~130 feeds. World feeds as before, plus section feeds (business, technology,
science, health, sports, entertainment, politics) and country feeds (US, UK, Australia,
India) for outlets that publish them. Cambodian outlets, all **unrated** because no public
bias chart covers them: Khmer Times, The Phnom Penh Post, CamboJA News (English) and
RFA Khmer (Khmer-language, listed on `/local`, not clustered). Kiripost, Cambodianess and
VOA Khmer were checked and have no working feed.

## Run locally

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY for AI summaries
npm run dev                  # live feeds
NEWS_DEMO=1 npm run dev      # sample data, no network needed (English summaries plus a few Khmer samples)
npm test                     # add TEST_DATABASE_URL=postgres://... to also run the DB tests
```

Demo mode uses `fixtures/demo-articles.json` (six English stories, one of them Cambodian,
a single-outlet Cambodian report, plus three Khmer-language reports) and `fixtures/demo-khmer-summaries.json` for Khmer text
on three stories, so both the translated and the "not available yet" states can be seen
at `/km`.

## Deploy (Vercel + Neon)

1. Import the repo on vercel.com.
2. Add a Postgres database (Vercel Storage → Neon, or neon.tech). This sets `DATABASE_URL`.
3. Add environment variables `ANTHROPIC_API_KEY` and `CRON_SECRET` (any long random string), then deploy.
   Optional: `SUMMARY_MODEL`, `MAX_STORIES`, `MAX_FEED_STORIES`, `NEXT_PUBLIC_SITE_URL`.
4. In the GitHub repo, add Actions secrets `APP_URL` (your Vercel URL) and `CRON_SECRET` (same value).
   `.github/workflows/refresh.yml` then refreshes the news every 30 minutes. Vercel's own cron
   (`vercel.json`) runs once a day as a backup, since the free plan allows no more.

## Next steps

- Accounts: sign-in plus a `users` / `follows` table so For You syncs across devices.
- Factuality and ownership data per outlet (shown as "coming soon" until a licensed source exists).
- Cluster Khmer-language articles with `Intl.Segmenter` tokens once there are several Khmer outlets.
- Use embeddings for better grouping across different wording and languages.
- Review the bias ratings, and check rating providers' licence terms before commercial use.

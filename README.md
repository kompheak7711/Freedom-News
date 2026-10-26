# Freedom News

A Ground News-style news aggregator.

Collects world news from RSS feeds, groups articles about the same event into stories,
summarizes each story with Claude, and shows how much coverage came from left, center,
and right outlets. It also flags **blindspots**: stories one side of the spectrum barely covered.

## How it works

| Step | File | What it does |
| --- | --- | --- |
| Collect | `src/lib/ingest.ts` | Fetches ~35 outlets' RSS feeds in parallel, keeps the last 48h, de-duplicates. |
| Rate | `src/lib/sources.ts` | One bias rating per outlet (Left to Right), approximated from AllSides / Ad Fontes. |
| Group | `src/lib/cluster.ts` | TF-IDF vectors of title + description, single-pass clustering plus a merge pass. |
| Measure | `src/lib/coverage.ts` | Counts distinct outlets per side and detects blindspots. |
| Summarize | `src/lib/summarize.ts` | Claude writes a neutral headline, summary, and left/right framing (structured output). |
| Store | `src/lib/db.ts` | Postgres keeps articles, per-story summaries, and the latest feed snapshot. |
| Serve | `src/lib/stories.ts`, `src/app/` | Pages read the latest snapshot; `/api/cron/refresh` rebuilds it every 30 min. |

With `DATABASE_URL` set, articles accumulate across refreshes, so a story keeps sources
whose feeds have since moved on, and a summary is reused until its story grows by half,
which keeps Claude costs down. Tables are created automatically on first use.
Without a database, the pipeline runs in memory at most once per 30 minutes.

## Run locally

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY for AI summaries
npm run dev                  # live feeds
NEWS_DEMO=1 npm run dev      # sample data, no network needed
npm test                     # add TEST_DATABASE_URL=postgres://... to also run the DB tests
```

## Deploy (Vercel + Neon)

1. Import the repo on vercel.com.
2. Add a Postgres database (Vercel Storage → Neon, or neon.tech). This sets `DATABASE_URL`.
3. Add environment variables `ANTHROPIC_API_KEY` and `CRON_SECRET` (any long random string), then deploy.
4. In the GitHub repo, add Actions secrets `APP_URL` (your Vercel URL) and `CRON_SECRET` (same value).
   `.github/workflows/refresh.yml` then refreshes the news every 30 minutes. Vercel's own cron
   (`vercel.json`) runs once a day as a backup, since the free plan allows no more.

## Next steps

- Story archive and search over stored articles.
- Use embeddings for better grouping across different wording and languages.
- Add more outlets (non-English feeds, regional sources) and per-country filters.
- Review the bias ratings, and check rating providers' licence terms before commercial use.

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
| Serve | `src/lib/stories.ts`, `src/app/` | Runs the pipeline at most every 30 min (Next.js data cache) and renders the pages. |

No database is needed yet: the latest run is cached, so feeds and the LLM are hit
once per refresh window, not per visitor.

## Run locally

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY for AI summaries
npm run dev                  # live feeds
NEWS_DEMO=1 npm run dev      # sample data, no network needed
npm test
```

## Deploy (Vercel)

Import the repo on vercel.com, add `ANTHROPIC_API_KEY` as an environment variable, deploy.

## Next steps

- Store articles and stories in Postgres so stories keep history beyond 48h.
- Use embeddings for better grouping across different wording and languages.
- Add more outlets (non-English feeds, regional sources) and per-country filters.
- Review the bias ratings, and check rating providers' licence terms before commercial use.

import postgres from "postgres";
import type { Article, StorySummary } from "./types";

type Sql = ReturnType<typeof postgres>;

const SCHEMA = `
create table if not exists articles (
  id text primary key,
  source_id text not null,
  title text not null,
  description text not null default '',
  url text not null,
  published_at timestamptz not null,
  image_url text,
  first_seen_at timestamptz not null default now()
);
create index if not exists articles_published_at_idx on articles (published_at desc);

create table if not exists story_summaries (
  story_id text primary key,
  article_count integer not null,
  summary jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists feed_snapshots (
  id bigserial primary key,
  generated_at timestamptz not null,
  data jsonb not null
);
`;

let sql: Sql | null = null;
let ready: Promise<void> | null = null;

/** Returns a migrated client, or null when DATABASE_URL is not set. */
export async function getDb(): Promise<Sql | null> {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!sql) {
    // prepare: false keeps it compatible with pooled connections (Neon, PgBouncer).
    sql = postgres(url, { max: 5, prepare: false, onnotice: () => {} });
    ready = sql.unsafe(SCHEMA).then(() => undefined);
  }
  await ready;
  return sql;
}

export async function closeDb(): Promise<void> {
  await sql?.end();
  sql = null;
  ready = null;
}

export async function saveArticles(db: Sql, articles: Article[]): Promise<void> {
  if (articles.length === 0) return;
  const rows = articles.map((a) => ({
    id: a.id,
    source_id: a.sourceId,
    title: a.title,
    description: a.description,
    url: a.url,
    published_at: a.publishedAt,
    image_url: a.imageUrl ?? null,
  }));
  // Insert in chunks to stay well under Postgres' parameter limit.
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    await db`
      insert into articles ${db(chunk)}
      on conflict (id) do update set
        title = excluded.title,
        description = excluded.description,
        image_url = coalesce(excluded.image_url, articles.image_url)
    `;
  }
}

export async function loadRecentArticles(db: Sql, hours: number): Promise<Article[]> {
  const rows = await db<
    { id: string; source_id: string; title: string; description: string; url: string; published_at: Date; image_url: string | null }[]
  >`
    select id, source_id, title, description, url, published_at, image_url
    from articles
    where published_at > now() - make_interval(hours => ${hours})
  `;
  return rows.map((r) => ({
    id: r.id,
    sourceId: r.source_id,
    title: r.title,
    description: r.description,
    url: r.url,
    publishedAt: r.published_at.toISOString(),
    imageUrl: r.image_url ?? undefined,
  }));
}

export interface StoredSummary {
  articleCount: number;
  summary: StorySummary;
}

export async function loadSummaries(db: Sql, storyIds: string[]): Promise<Map<string, StoredSummary>> {
  if (storyIds.length === 0) return new Map();
  const rows = await db<{ story_id: string; article_count: number; summary: StorySummary }[]>`
    select story_id, article_count, summary from story_summaries where story_id in ${db(storyIds)}
  `;
  return new Map(rows.map((r) => [r.story_id, { articleCount: r.article_count, summary: r.summary }]));
}

export async function saveSummary(db: Sql, storyId: string, articleCount: number, summary: StorySummary) {
  await db`
    insert into story_summaries (story_id, article_count, summary, updated_at)
    values (${storyId}, ${articleCount}, ${db.json(JSON.parse(JSON.stringify(summary)))}, now())
    on conflict (story_id) do update set
      article_count = excluded.article_count,
      summary = excluded.summary,
      updated_at = now()
  `;
}

export async function saveSnapshot<T>(db: Sql, generatedAt: string, data: T): Promise<void> {
  await db`insert into feed_snapshots (generated_at, data) values (${generatedAt}, ${db.json(JSON.parse(JSON.stringify(data)))})`;
  await db`delete from feed_snapshots where generated_at < now() - interval '7 days'`;
}

export async function loadLatestSnapshot<T>(db: Sql): Promise<T | null> {
  const rows = await db<{ data: T }[]>`select data from feed_snapshots order by generated_at desc limit 1`;
  return rows[0]?.data ?? null;
}

/** Case-insensitive search over every stored article's title and description. */
export async function searchArticles(db: Sql, query: string, limit = 50): Promise<Article[]> {
  const pattern = `%${query.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  const rows = await db<
    { id: string; source_id: string; title: string; description: string; url: string; published_at: Date; image_url: string | null }[]
  >`
    select id, source_id, title, description, url, published_at, image_url
    from articles
    where title ilike ${pattern} or description ilike ${pattern}
    order by published_at desc
    limit ${limit}
  `;
  return rows.map((r) => ({
    id: r.id,
    sourceId: r.source_id,
    title: r.title,
    description: r.description,
    url: r.url,
    publishedAt: r.published_at.toISOString(),
    imageUrl: r.image_url ?? undefined,
  }));
}

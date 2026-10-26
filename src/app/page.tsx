import { StoryCard } from "@/components/StoryCard";
import { getStoryFeed } from "@/lib/stories";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const feed = await getStoryFeed();
  const blindspots = view === "blindspot";
  const stories = blindspots ? feed.stories.filter((s) => s.blindspot) : feed.stories;

  return (
    <div>
      {feed.demo && (
        <p className="mb-4 rounded border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Demo mode: showing sample articles from <code>fixtures/demo-articles.json</code>, not live news.
        </p>
      )}
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">{blindspots ? "Blindspots" : "Top stories"}</h1>
        <p className="text-xs text-[var(--muted)]">
          {feed.articleCount} articles · updated {new Date(feed.generatedAt).toUTCString()}
          {feed.failedSources.length > 0 && ` · ${feed.failedSources.length} feeds unavailable`}
        </p>
      </div>
      {blindspots && (
        <p className="mb-5 text-sm text-[var(--muted)]">
          Stories covered heavily by one side of the spectrum and barely or not at all by the other.
        </p>
      )}
      {stories.length === 0 ? (
        <p className="text-[var(--muted)]">No stories yet. Feeds may still be loading or unreachable.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </div>
  );
}

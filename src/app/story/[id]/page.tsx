import Link from "next/link";
import { notFound } from "next/navigation";
import { CoverageBar } from "@/components/CoverageBar";
import { BlindspotBadge, TimeAgo } from "@/components/bits";
import { BIAS_LABEL, getSource, sideOf } from "@/lib/sources";
import { getStory } from "@/lib/stories";
import type { Article, Side } from "@/lib/types";

export const dynamic = "force-dynamic";

const COLUMNS: { side: Side; title: string; color: string }[] = [
  { side: "left", title: "Left", color: "var(--left)" },
  { side: "center", title: "Center", color: "var(--center)" },
  { side: "right", title: "Right", color: "var(--right)" },
];

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const story = await getStory(id);
  if (!story) notFound();

  const bySide: Record<Side, Article[]> = { left: [], center: [], right: [] };
  for (const a of story.articles) {
    const source = getSource(a.sourceId);
    if (source) bySide[sideOf(source.bias)].push(a);
  }
  const { summary } = story;

  return (
    <article>
      <Link href="/" className="text-sm text-[var(--muted)] hover:underline">← All stories</Link>
      <div className="mt-3 mb-2 flex items-center gap-2 text-xs text-[var(--muted)]">
        <span>First reported <TimeAgo iso={story.firstSeen} /></span>
        {story.blindspot && <BlindspotBadge side={story.blindspot} />}
      </div>
      <h1 className="mb-4 text-3xl font-bold leading-tight">{summary.headline}</h1>
      <div className="mb-6 max-w-3xl">
        <CoverageBar coverage={story.coverage} large />
      </div>

      <section className="mb-8 max-w-3xl rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Summary</h2>
        <p className="leading-relaxed">{summary.summary}</p>
        {(summary.leftFraming || summary.rightFraming) && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {summary.leftFraming && (
              <div className="border-l-4 border-[var(--left)] pl-3 text-sm">
                <p className="font-semibold">How the left covered it</p>
                <p className="text-[var(--muted)]">{summary.leftFraming}</p>
              </div>
            )}
            {summary.rightFraming && (
              <div className="border-l-4 border-[var(--right)] pl-3 text-sm">
                <p className="font-semibold">How the right covered it</p>
                <p className="text-[var(--muted)]">{summary.rightFraming}</p>
              </div>
            )}
          </div>
        )}
        {!summary.generated && (
          <p className="mt-3 text-xs text-[var(--muted)]">
            Summary taken from article text. Set ANTHROPIC_API_KEY to generate AI summaries.
          </p>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        {COLUMNS.map(({ side, title, color }) => (
          <section key={side}>
            <h2 className="mb-3 border-b-2 pb-1 font-semibold" style={{ borderColor: color }}>
              {title} <span className="text-sm font-normal text-[var(--muted)]">({bySide[side].length})</span>
            </h2>
            {bySide[side].length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No coverage from {side}-leaning outlets.</p>
            ) : (
              <ul className="space-y-3">
                {bySide[side].map((a) => {
                  const source = getSource(a.sourceId)!;
                  return (
                    <li key={a.id} className="rounded border border-[var(--border)] bg-[var(--card)] p-3">
                      <p className="mb-1 text-xs text-[var(--muted)]">
                        {source.name} · {BIAS_LABEL[source.bias]} · <TimeAgo iso={a.publishedAt} />
                      </p>
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                        {a.title}
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}

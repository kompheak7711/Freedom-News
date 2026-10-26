import Link from "next/link";
import type { Story } from "@/lib/types";
import { CoverageBar } from "./CoverageBar";
import { BlindspotBadge, TimeAgo } from "./bits";

export function StoryCard({ story }: { story: Story }) {
  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--muted)]">
      <Link href={`/story/${story.id}`} className="block">
        <div className="mb-2 flex items-center gap-2 text-xs text-[var(--muted)]">
          <TimeAgo iso={story.lastUpdated} />
          {story.blindspot && <BlindspotBadge side={story.blindspot} />}
        </div>
        <h2 className="mb-2 text-lg font-semibold leading-snug">{story.summary.headline}</h2>
        <p className="mb-3 line-clamp-3 text-sm text-[var(--muted)]">{story.summary.summary}</p>
        <CoverageBar coverage={story.coverage} />
      </Link>
    </article>
  );
}

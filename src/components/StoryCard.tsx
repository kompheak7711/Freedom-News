import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { dominantSide, outletCount } from "@/lib/coverage";
import { localizedSummary } from "@/lib/text";
import type { Story } from "@/lib/types";
import { BlindspotBadge, CategoryTag, TimeAgo } from "./bits";
import { CoverageBar } from "./CoverageBar";

export type CardVariant = "hero" | "grid" | "row" | "compact";

export function StoryImage({ story, className = "" }: { story: Story; className?: string }) {
  if (story.imageUrl) {
    return (
      // Publisher images come from dozens of hosts, so they are served as-is.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={story.imageUrl} alt="" loading="lazy" className={`h-full w-full object-cover ${className}`} />
    );
  }
  return (
    <div className={`placeholder-${story.category} flex h-full w-full items-end p-3 ${className}`} aria-hidden="true">
      <span className="text-3xl font-black uppercase tracking-tight text-white/30">{story.category.slice(0, 1)}</span>
    </div>
  );
}

export async function StoryCard({ story, variant = "grid", rank }: { story: Story; variant?: CardVariant; rank?: number }) {
  const locale = await getLocale();
  const t = await getTranslations();
  const text = localizedSummary(story.summary, locale);
  const href = `/story/${story.id}`;
  const dominant = dominantSide(story.coverage);
  const sources = outletCount(story.coverage);
  const lang = text.lang !== locale ? text.lang : undefined;
  const region = story.regions[0];

  const meta = (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
      <CategoryTag category={story.category} small />
      {region && <span>{t(`locations.${region}` as "locations.KH")}</span>}
      <span aria-hidden="true">·</span>
      <TimeAgo iso={story.lastUpdated} />
      {story.blindspot && <BlindspotBadge side={story.blindspot} small />}
      {text.fallback && (
        <span className="chip text-[10px] uppercase" title={t("story.khmerMissing")} lang="en">
          EN
        </span>
      )}
    </div>
  );

  const coverageLine = (
    <p className="text-xs text-muted">
      {dominant
        ? `${t("coverage.dominant", { pct: dominant.pct, side: t(`bias.${dominant.side}`) })}: ${t("coverage.sources", { count: sources })}`
        : t("coverage.sources", { count: sources })}
    </p>
  );

  if (variant === "hero") {
    return (
      <article className="card overflow-hidden md:grid md:grid-cols-5">
        <Link href={href} className="story-image block aspect-[16/9] md:col-span-3 md:aspect-auto md:min-h-[22rem]">
          <StoryImage story={story} />
        </Link>
        <div className="flex flex-col gap-3 p-5 md:col-span-2">
          {meta}
          <h2 className="headline text-2xl font-bold md:text-3xl" lang={lang}>
            <Link href={href} className="hover:underline">
              {text.headline}
            </Link>
          </h2>
          <p className="line-clamp-3 text-sm text-muted md:text-base" lang={lang}>
            {text.summary}
          </p>
          <div className="mt-auto space-y-2">
            <CoverageBar coverage={story.coverage} size="md" />
            {coverageLine}
          </div>
        </div>
      </article>
    );
  }

  if (variant === "row") {
    return (
      <article className="flex items-start gap-3 border-b border-line py-3 last:border-b-0">
        {rank !== undefined && <span className="w-6 shrink-0 text-lg font-black text-muted">{rank}</span>}
        <div className="min-w-0 flex-1">
          <h3 className="headline text-base font-semibold" lang={lang}>
            <Link href={href} className="hover:underline">
              {text.headline}
            </Link>
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {coverageLine}
            {story.blindspot && <BlindspotBadge side={story.blindspot} small />}
          </div>
        </div>
        <Link href={href} className="story-image hidden h-16 w-24 shrink-0 overflow-hidden rounded sm:block">
          <StoryImage story={story} />
        </Link>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="card flex gap-3 p-3">
        <Link href={href} className="story-image h-20 w-28 shrink-0 overflow-hidden rounded">
          <StoryImage story={story} />
        </Link>
        <div className="min-w-0 flex-1">
          {meta}
          <h3 className="headline mt-1 line-clamp-2 text-sm font-semibold" lang={lang}>
            <Link href={href} className="hover:underline">
              {text.headline}
            </Link>
          </h3>
          <div className="mt-2">
            <CoverageBar coverage={story.coverage} size="sm" showUnrated={false} />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="card flex flex-col overflow-hidden transition hover:border-muted">
      <Link href={href} className="story-image block aspect-[16/9]">
        <StoryImage story={story} />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {meta}
        <h3 className="headline text-lg font-semibold" lang={lang}>
          <Link href={href} className="hover:underline">
            {text.headline}
          </Link>
        </h3>
        <div className="mt-auto space-y-1.5 pt-2">
          <CoverageBar coverage={story.coverage} size="sm" />
          {coverageLine}
        </div>
      </div>
    </article>
  );
}

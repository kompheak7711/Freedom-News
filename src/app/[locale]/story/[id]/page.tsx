import type { Metadata } from "next";
import { getFormatter, getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { CoverageBar } from "@/components/CoverageBar";
import { FramingTabs } from "@/components/FramingTabs";
import { KhmerNote } from "@/components/KhmerNote";
import { OutletList, type OutletListItem } from "@/components/OutletList";
import { SectionHeading } from "@/components/SectionHeading";
import { StoryCard, StoryImage } from "@/components/StoryCard";
import { BlindspotBadge, CategoryTag, TimeAgo } from "@/components/bits";
import { Link } from "@/i18n/navigation";
import { dominantSide, outletCount, percentages } from "@/lib/coverage";
import { isKhmerText } from "@/lib/khmer";
import { pageMetadata } from "@/lib/seo";
import { getSource, sideOf } from "@/lib/sources";
import { getStory, getStoryFeed, relatedStories } from "@/lib/stories";
import { localizedSummary } from "@/lib/text";

export const dynamic = "force-dynamic";

type Params = Promise<{ locale: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, id } = await params;
  const story = await getStory(id);
  if (!story) return {};
  const text = localizedSummary(story.summary, locale);
  return pageMetadata({ locale, path: `/story/${id}`, title: text.headline, description: text.summary, image: story.imageUrl });
}

export default async function StoryPage({ params }: { params: Params }) {
  const { locale: param, id } = await params;
  setRequestLocale(param);
  const locale = await getLocale();
  const t = await getTranslations();
  const format = await getFormatter();
  const feed = await getStoryFeed();
  const story = feed.stories.find((s) => s.id === id);
  if (!story) notFound();

  const text = localizedSummary(story.summary, locale);
  const lang = text.lang !== locale ? text.lang : undefined;
  const pct = percentages(story.coverage);
  const dominant = dominantSide(story.coverage);
  const first = story.articles[story.articles.length - 1];
  const firstOutlet = getSource(first.sourceId)?.name ?? first.sourceId;
  const related = relatedStories(feed, story);
  const items: OutletListItem[] = story.articles.map((a) => {
    const source = getSource(a.sourceId);
    const bias = source?.bias ?? "unrated";
    return {
      id: a.id,
      outlet: source?.name ?? a.sourceId,
      bias,
      side: sideOf(bias),
      title: a.title,
      url: a.url,
      timeLabel: format.relativeTime(new Date(a.publishedAt), { now: new Date(), style: "long" }),
      lang: isKhmerText(a.title) ? "km" : undefined,
    };
  });
  const sideRows: Array<{ label: string; value: number; color?: string }> = [
    { label: t("story.totalSources"), value: outletCount(story.coverage) },
    { label: t("story.leaningLeft"), value: story.coverage.left, color: "var(--left)" },
    { label: t("story.center"), value: story.coverage.center, color: "var(--center)" },
    { label: t("story.leaningRight"), value: story.coverage.right, color: "var(--right)" },
  ];
  if (story.coverage.unrated) sideRows.push({ label: t("story.notRated"), value: story.coverage.unrated, color: "var(--muted)" });

  return (
    <article className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <CategoryTag category={story.category} />
            {story.regions.map((r) => (
              <Link key={r} href="/local" className="chip text-xs">
                {t(`locations.${r}` as "locations.KH")}
              </Link>
            ))}
            {story.blindspot && <BlindspotBadge side={story.blindspot} />}
          </div>
          <h1 className="headline text-3xl font-black tracking-tight md:text-4xl" lang={lang}>
            {text.headline}
          </h1>
          {text.fallback && <KhmerNote />}
          <p className="text-sm text-muted">
            {t("story.published", { time: "" })}
            <TimeAgo iso={story.firstSeen} /> · {t("story.updated", { time: "" })}
            <TimeAgo iso={story.lastUpdated} /> · {t("story.firstReported", { outlet: firstOutlet })}
          </p>
        </header>

        {story.imageUrl && (
          <div className="story-image aspect-[16/9] overflow-hidden rounded-xl">
            <StoryImage story={story} />
          </div>
        )}

        <FramingTabs text={text} generated={story.summary.generated} />
        <p className="text-xs text-muted">{story.summary.generated ? t("story.aiNote") : t("story.extractiveNote")}</p>

        <OutletList items={items} />

        {related.length > 0 && (
          <section>
            <SectionHeading title={t("story.moreLikeThis")} />
            <div className="grid gap-3 sm:grid-cols-2">
              {related.map((s) => (
                <StoryCard key={s.id} story={s} variant="compact" />
              ))}
            </div>
          </section>
        )}
      </div>

      <aside className="space-y-6">
        <section className="card p-5">
          <h2 className="text-lg font-bold">{t("story.coverageDetails")}</h2>
          <dl className="mt-3 divide-y divide-line text-sm">
            {sideRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2">
                <dt className="flex items-center gap-2">
                  {row.color && <span className="inline-block h-3 w-3 rounded-sm" style={{ background: row.color }} aria-hidden="true" />}
                  {row.label}
                </dt>
                <dd className="font-semibold">{format.number(row.value)}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between py-2">
              <dt>{t("story.lastUpdated")}</dt>
              <dd className="font-semibold">
                <TimeAgo iso={story.lastUpdated} />
              </dd>
            </div>
          </dl>
          <h3 className="mt-5 text-sm font-bold uppercase tracking-wide">{t("story.biasDistribution")}</h3>
          {dominant && <p className="mt-1 text-sm text-muted">{t("story.mostly", { pct: dominant.pct, side: t(`bias.${dominant.side}`) })}</p>}
          <div className="mt-3">
            <CoverageBar coverage={story.coverage} size="lg" showLegend />
          </div>
          <ul className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            {(["left", "center", "right"] as const).map((side) => (
              <li key={side} className="rounded-lg border border-line p-2">
                <span className="block text-lg font-bold" style={{ color: `var(--${side})` }}>
                  {pct[side]}%
                </span>
                {t(`bias.${side}`)}
              </li>
            ))}
          </ul>
          {story.coverage.unrated ? <p className="mt-3 text-xs text-muted">{t("story.unratedNote", { count: story.coverage.unrated })}</p> : null}
        </section>

        <section className="card p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide">
            {t("story.factuality")} · {t("story.ownership")}
          </h2>
          <p className="mt-1 text-sm">
            <span className="chip text-xs">{t("story.comingSoon")}</span>
          </p>
          <p className="mt-2 text-xs text-muted">{t("story.comingSoonText")}</p>
        </section>

        <section className="card p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide">{t("story.similarTopics")}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/category/${story.category}`} className="chip">
              {t(`categories.${story.category}`)}
            </Link>
            {story.regions.map((r) => (
              <Link key={r} href="/local" className="chip">
                {t(`locations.${r}` as "locations.KH")}
              </Link>
            ))}
            {story.keywords.map((k) => (
              <Link key={k} href={`/search?q=${encodeURIComponent(k)}`} className="chip capitalize">
                {k}
              </Link>
            ))}
          </div>
        </section>
      </aside>
    </article>
  );
}

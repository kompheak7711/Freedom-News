import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DailyBriefing } from "@/components/DailyBriefing";
import { SectionHeading } from "@/components/SectionHeading";
import { StoryCard } from "@/components/StoryCard";
import { TimeAgo } from "@/components/bits";
import { Link } from "@/i18n/navigation";
import { pageMetadata } from "@/lib/seo";
import { OUTLETS } from "@/lib/sources";
import { blindspotStories, getStoryFeed, storiesInCategory } from "@/lib/stories";
import { CATEGORIES } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return pageMetadata({ locale, path: "/", title: `${t("siteName")} — ${t("tagline")}`, description: t("description") });
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const feed = await getStoryFeed();
  const [hero, ...rest] = feed.stories;
  const topList = rest.slice(0, 6);
  const briefing = feed.stories.slice(0, 5);
  const grid = rest.slice(6, 18);
  const blindspots = blindspotStories(feed).slice(0, 4);
  const sections = CATEGORIES.map((c) => ({ category: c, stories: storiesInCategory(feed, c) }))
    .filter((s) => s.stories.length >= 2)
    .sort((a, b) => b.stories.length - a.stories.length)
    .slice(0, 3);

  return (
    <div className="space-y-10">
      {feed.demo && (
        <p className="rounded-lg border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {t("home.demoBanner")}
        </p>
      )}

      <p className="flex flex-wrap gap-x-3 text-xs text-muted">
        <span>{t("home.feedStats", { articles: feed.articleCount, outlets: OUTLETS.length })}</span>
        <span>
          {t("home.updated", { time: "" })}
          <TimeAgo iso={feed.generatedAt} />
        </span>
        {feed.failedSources.length > 0 && <span>{t("home.feedsUnavailable", { count: feed.failedSources.length })}</span>}
      </p>

      {!hero ? (
        <p className="card p-8 text-center text-muted">{t("home.empty")}</p>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <h2 className="sr-only">{t("home.topStory")}</h2>
              <StoryCard story={hero} variant="hero" />
              {grid.length > 0 && (
                <section>
                  <SectionHeading title={t("home.latest")} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    {grid.map((story) => (
                      <StoryCard key={story.id} story={story} />
                    ))}
                  </div>
                </section>
              )}
            </div>
            <div className="space-y-6">
              <DailyBriefing stories={briefing} />
              <section className="card p-4">
                <SectionHeading title={t("home.topNews")} />
                <div>
                  {topList.map((story, i) => (
                    <StoryCard key={story.id} story={story} variant="row" rank={i + 2} />
                  ))}
                </div>
              </section>
            </div>
          </section>

          {blindspots.length > 0 && (
            <section className="rounded-xl border border-line bg-soft p-4 md:p-6">
              <SectionHeading title={t("home.blindspotSection")} href="/blindspot" linkLabel={t("blindspot.viewFeed")}>
                {t("blindspot.subtitle")}
              </SectionHeading>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {blindspots.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            </section>
          )}

          {sections.map(({ category, stories }) => (
            <section key={category}>
              <SectionHeading
                title={t("home.moreIn", { category: t(`categories.${category}`) })}
                href={`/category/${category}`}
                linkLabel={t("common.viewAll")}
              />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {stories.slice(0, 4).map((story) => (
                  <StoryCard key={story.id} story={story} variant="compact" />
                ))}
              </div>
            </section>
          ))}

          <p className="text-center text-sm text-muted">
            <Link href="/sources" className="hover:underline">
              {t("nav.sources")}
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

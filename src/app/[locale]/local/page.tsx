import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArticleRow } from "@/components/ArticleRow";
import { LocationPicker } from "@/components/LocationPicker";
import { SectionHeading } from "@/components/SectionHeading";
import { StoryCard } from "@/components/StoryCard";
import { BiasLabel } from "@/components/bits";
import { readLocation } from "@/lib/request-context";
import { pageMetadata } from "@/lib/seo";
import { OUTLETS } from "@/lib/sources";
import { getStoryFeed, localArticles, localStories } from "@/lib/stories";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return pageMetadata({ locale, path: "/local", title: t("meta.local"), description: t("local.chooseText") });
}

export default async function LocalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const { location, detected } = await readLocation();
  const feed = await getStoryFeed();
  const stories = location ? localStories(feed, location) : [];
  const latest = location ? localArticles(feed, location) : [];
  const khmer = location === "KH" ? feed.khmerArticles : [];
  const outletsHere = location ? OUTLETS.filter((o) => o.country === location) : [];
  const name = location ? t(`locations.${location}`) : "";
  const [lead, ...rest] = stories;

  return (
    <div className="space-y-8">
      <header className="card p-5 md:p-6">
        <h1 className="text-3xl font-black tracking-tight">{location ? t("local.subtitle", { location: name }) : t("local.chooseTitle")}</h1>
        <p className="mt-2 text-muted">{t("local.chooseText")}</p>
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{location ? t("local.change") : t("local.setLocation")}</p>
          <LocationPicker current={location} />
          {detected && <p className="mt-2 text-xs text-muted">{t("local.detected")}</p>}
        </div>
      </header>

      {location && (
        <section>
          <SectionHeading title={t("local.title")}>{t("local.storiesCount", { count: stories.length })}</SectionHeading>
          {!lead ? (
            <div className="card p-8 text-center">
              <p className="font-semibold">{t("local.empty", { location: name })}</p>
              {latest.length === 0 && khmer.length === 0 && <p className="mt-2 text-sm text-muted">{t("local.emptyText")}</p>}
            </div>
          ) : (
            <div className="space-y-4">
              <StoryCard story={lead} variant="hero" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {location && latest.length > 0 && (
        <section>
          <SectionHeading title={t("local.latestFromOutlets", { location: name })}>{t("local.latestFromOutletsText")}</SectionHeading>
          <ul className="card px-4">
            {latest.map((article) => (
              <ArticleRow key={article.id} article={article} />
            ))}
          </ul>
        </section>
      )}

      {location === "KH" && (
        <section>
          <SectionHeading title={t("local.khmerCoverage")}>{t("local.khmerCoverageText")}</SectionHeading>
          {khmer.length === 0 ? (
            <p className="card p-6 text-center text-muted">{t("local.khmerEmpty")}</p>
          ) : (
            <ul className="card px-4" lang="km">
              {khmer.map((article) => (
                <ArticleRow key={article.id} article={article} />
              ))}
            </ul>
          )}
        </section>
      )}

      {location && (
        <section>
          <SectionHeading title={t("local.outletsHere", { location: name })} />
          {outletsHere.length === 0 ? (
            <p className="text-sm text-muted">{t("local.noOutlets", { location: name })}</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {outletsHere.map((o) => (
                <li key={o.id} className="chip gap-2">
                  <a href={o.homepage} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {o.name}
                  </a>
                  <BiasLabel bias={o.bias} compact />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

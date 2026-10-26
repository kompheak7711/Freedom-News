import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FollowEditor } from "@/components/FollowEditor";
import { SectionHeading } from "@/components/SectionHeading";
import { StoryCard } from "@/components/StoryCard";
import { hasPrefs, personalize } from "@/lib/prefs";
import { readPrefs } from "@/lib/request-context";
import { pageMetadata } from "@/lib/seo";
import { OUTLETS } from "@/lib/sources";
import { getStoryFeed } from "@/lib/stories";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return pageMetadata({ locale, path: "/for-you", title: t("meta.forYou"), description: t("forYou.subtitle") });
}

export default async function ForYouPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const prefs = await readPrefs();
  const feed = await getStoryFeed();
  const stories = personalize(feed, prefs);
  const outlets = [...OUTLETS].sort((a, b) => a.name.localeCompare(b.name)).map((o) => ({ id: o.id, name: o.name }));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black tracking-tight">{t("forYou.title")}</h1>
        <p className="mt-2 text-muted">{t("forYou.subtitle")}</p>
      </header>
      <FollowEditor initial={prefs} outlets={outlets} />
      <section>
        <SectionHeading title={t("forYou.stories")} />
        {!hasPrefs(prefs) ? (
          <p className="card p-8 text-center text-muted">{t("forYou.empty")}</p>
        ) : stories.length === 0 ? (
          <p className="card p-8 text-center text-muted">{t("forYou.noMatches")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

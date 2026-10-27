import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SectionHeading } from "@/components/SectionHeading";
import { StoryCard } from "@/components/StoryCard";
import { isCategory } from "@/lib/categories";
import { pageMetadata } from "@/lib/seo";
import { getStoryFeed, storiesInCategory } from "@/lib/stories";

export const dynamic = "force-dynamic";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isCategory(slug)) return {};
  const t = await getTranslations({ locale });
  const name = t(`categories.${slug}`);
  return pageMetadata({ locale, path: `/category/${slug}`, title: t("meta.category", { category: name }), description: t("meta.description") });
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isCategory(slug)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const feed = await getStoryFeed();
  const stories = storiesInCategory(feed, slug);
  const name = t(`categories.${slug}`);
  const [lead, ...rest] = stories;

  return (
    <div className="space-y-6">
      <SectionHeading title={name}>{t("category.count", { count: stories.length })}</SectionHeading>
      {!lead ? (
        <p className="card p-8 text-center text-muted">{t("category.empty", { category: name })}</p>
      ) : (
        <>
          <StoryCard story={lead} variant="hero" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

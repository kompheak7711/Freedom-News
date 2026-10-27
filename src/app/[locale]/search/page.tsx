import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArticleRow } from "@/components/ArticleRow";
import { SearchForm } from "@/components/SearchForm";
import { SectionHeading } from "@/components/SectionHeading";
import { StoryCard } from "@/components/StoryCard";
import { Link } from "@/i18n/navigation";
import { searchEverything } from "@/lib/search";
import { pageMetadata } from "@/lib/seo";
import { getStoryFeed } from "@/lib/stories";
import { CATEGORIES } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return pageMetadata({ locale, path: "/search", title: t("meta.search"), description: t("search.hint") });
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();
  const query = (q ?? "").trim().slice(0, 100);
  const results = query ? await searchEverything(await getStoryFeed(), query) : null;

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-black tracking-tight">{t("search.title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("search.hint")}</p>
        <div className="mt-4">
          <SearchForm query={query} />
        </div>
      </header>

      {!results ? (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("search.suggestions")}</h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Link key={c} href={`/category/${c}`} className="chip">
                {t(`categories.${c}`)}
              </Link>
            ))}
          </div>
        </section>
      ) : results.stories.length === 0 && results.articles.length === 0 ? (
        <p className="card p-8 text-center text-muted">{t("search.none", { query })}</p>
      ) : (
        <>
          <p className="text-sm text-muted">
            {t("search.results", { query })} · {t("search.stories", { count: results.stories.length })} ·{" "}
            {t("search.articles", { count: results.articles.length })}
          </p>
          {results.stories.length > 0 && (
            <section>
              <SectionHeading title={t("search.storiesHeading")} />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.stories.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            </section>
          )}
          {results.articles.length > 0 && (
            <section>
              <SectionHeading title={t("search.articlesHeading")} />
              <ul className="card px-4">
                {results.articles.map((article) => (
                  <ArticleRow key={article.id} article={article} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

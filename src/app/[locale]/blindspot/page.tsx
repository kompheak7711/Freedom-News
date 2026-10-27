import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SectionHeading } from "@/components/SectionHeading";
import { StoryCard } from "@/components/StoryCard";
import { Link } from "@/i18n/navigation";
import { pageMetadata } from "@/lib/seo";
import { blindspotStories, getStoryFeed } from "@/lib/stories";
import type { Side } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ side?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return pageMetadata({ locale, path: "/blindspot", title: t("meta.blindspot"), description: t("blindspot.subtitle") });
}

export default async function BlindspotPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { side } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();
  const feed = await getStoryFeed();
  const filter: Side | undefined = side === "left" || side === "right" ? side : undefined;
  const forLeft = blindspotStories(feed, "left");
  const forRight = blindspotStories(feed, "right");
  const tabs: Array<{ id: Side | "all"; label: string; href: string }> = [
    { id: "all", label: t("blindspot.tabAll"), href: "/blindspot" },
    { id: "left", label: t("blindspot.tabLeft"), href: "/blindspot?side=left" },
    { id: "right", label: t("blindspot.tabRight"), href: "/blindspot?side=right" },
  ];

  const section = (missing: Side, stories: typeof forLeft) => (
    <section key={missing}>
      <SectionHeading title={missing === "left" ? t("blindspot.forLeft") : t("blindspot.forRight")}>
        {missing === "left" ? t("blindspot.leftDesc") : t("blindspot.rightDesc")}
      </SectionHeading>
      {stories.length === 0 ? (
        <p className="card p-6 text-center text-muted">{t("blindspot.empty")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-black tracking-tight">{t("blindspot.title")}</h1>
          <p className="mt-2 text-muted">{t("blindspot.subtitle")}</p>
          <p className="mt-2 text-xs text-muted">{t("blindspot.about")}</p>
        </div>
        <nav className="flex gap-2" aria-label={t("blindspot.title")}>
          {tabs.map((tab) => (
            <Link key={tab.id} href={tab.href} className="chip" data-active={(filter ?? "all") === tab.id}>
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>
      {(filter === undefined || filter === "left") && section("left", forLeft)}
      {(filter === undefined || filter === "right") && section("right", forRight)}
    </div>
  );
}

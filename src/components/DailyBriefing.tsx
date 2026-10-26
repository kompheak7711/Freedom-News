import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { localizedSummary, readingMinutes } from "@/lib/text";
import type { Story } from "@/lib/types";
import { StoryImage } from "./StoryCard";

/** Ground News-style "Daily Briefing" box: the day's widest-covered stories in one read. */
export async function DailyBriefing({ stories }: { stories: Story[] }) {
  const locale = await getLocale();
  const t = await getTranslations("home");
  if (stories.length === 0) return null;
  const texts = stories.map((s) => localizedSummary(s.summary, locale));
  const articles = stories.reduce((n, s) => n + s.articles.length, 0);
  const minutes = readingMinutes(texts.map((x) => `${x.headline} ${x.summary}`).join(" "));
  const [lead, ...rest] = stories;
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-line bg-soft px-4 py-2">
        <h2 className="text-sm font-bold uppercase tracking-wide">{t("dailyBriefing")}</h2>
      </div>
      <div className="p-4">
        <p className="text-xs text-muted">{t("briefingStats", { stories: stories.length, articles, minutes })}</p>
        <div className="mt-3 flex gap-3">
          <Link href={`/story/${lead.id}`} className="story-image h-16 w-20 shrink-0 overflow-hidden rounded">
            <StoryImage story={lead} />
          </Link>
          <div className="min-w-0">
            <h3 className="headline font-semibold" lang={texts[0].lang !== locale ? texts[0].lang : undefined}>
              <Link href={`/story/${lead.id}`} className="hover:underline">
                {texts[0].headline}
              </Link>
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted" lang={texts[0].lang !== locale ? texts[0].lang : undefined}>
              {texts[0].summary}
            </p>
          </div>
        </div>
        <ul className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
          {rest.map((story, i) => (
            <li key={story.id} className="flex gap-2">
              <span className="text-muted">+</span>
              <Link href={`/story/${story.id}`} className="line-clamp-2 hover:underline" lang={texts[i + 1].lang !== locale ? texts[i + 1].lang : undefined}>
                {texts[i + 1].headline}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

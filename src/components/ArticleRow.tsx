import { getLocale, getTranslations } from "next-intl/server";
import { getSource } from "@/lib/sources";
import { isKhmerText } from "@/lib/khmer";
import type { Article } from "@/lib/types";
import { BiasLabel, OutletAvatar, TimeAgo } from "./bits";

/**
 * One article with its outlet and rating, for article lists and search
 * results. On Khmer pages an article with a stored translation shows it;
 * one without is shown in English with an "EN" tag, like story cards.
 */
export async function ArticleRow({ article }: { article: Article }) {
  const locale = await getLocale();
  const t = await getTranslations();
  const source = getSource(article.sourceId);
  const name = source?.name ?? article.sourceId;
  const translated = locale === "km" && Boolean(article.titleKm);
  const title = translated ? article.titleKm! : article.title;
  const description = translated ? (article.descriptionKm ?? "") : article.description;
  const textLang = translated || isKhmerText(title) ? "km" : "en";
  const lang = textLang !== locale ? textLang : undefined;
  return (
    <li className="flex gap-3 border-b border-line py-3 last:border-b-0">
      <OutletAvatar name={name} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="font-medium text-ink">{name}</span>
          {source && <BiasLabel bias={source.bias} compact />}
          <TimeAgo iso={article.publishedAt} />
          {locale === "km" && textLang === "en" && (
            <span className="chip text-[10px] uppercase" title={t("story.khmerMissing")} lang="en">
              EN
            </span>
          )}
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block font-semibold hover:underline"
          lang={lang}
          title={t("common.articleFrom", { outlet: name })}
        >
          {title}
        </a>
        {description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted" lang={lang}>
            {description}
          </p>
        )}
      </div>
    </li>
  );
}

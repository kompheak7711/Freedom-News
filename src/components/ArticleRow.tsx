import { getTranslations } from "next-intl/server";
import { getSource } from "@/lib/sources";
import { isKhmerText } from "@/lib/khmer";
import type { Article } from "@/lib/types";
import { BiasLabel, OutletAvatar, TimeAgo } from "./bits";

/** One article with its outlet and rating, for article lists and search results. */
export async function ArticleRow({ article }: { article: Article }) {
  const t = await getTranslations("common");
  const source = getSource(article.sourceId);
  const name = source?.name ?? article.sourceId;
  const lang = isKhmerText(article.title) ? "km" : undefined;
  return (
    <li className="flex gap-3 border-b border-line py-3 last:border-b-0">
      <OutletAvatar name={name} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="font-medium text-ink">{name}</span>
          {source && <BiasLabel bias={source.bias} compact />}
          <TimeAgo iso={article.publishedAt} />
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block font-semibold hover:underline"
          lang={lang}
          title={t("articleFrom", { outlet: name })}
        >
          {article.title}
        </a>
        {article.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted" lang={lang}>
            {article.description}
          </p>
        )}
      </div>
    </li>
  );
}

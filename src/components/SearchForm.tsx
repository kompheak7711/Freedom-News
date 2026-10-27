import { getLocale, getTranslations } from "next-intl/server";

/** Plain GET form so search works without JavaScript. */
export async function SearchForm({ compact = false, query = "" }: { compact?: boolean; query?: string }) {
  const locale = await getLocale();
  const t = await getTranslations("search");
  return (
    <form action={`/${locale}/search`} method="get" role="search" className={`flex items-center gap-2 ${compact ? "" : "w-full"}`}>
      <label className="sr-only" htmlFor={compact ? "q-compact" : "q"}>
        {t("title")}
      </label>
      <input
        id={compact ? "q-compact" : "q"}
        name="q"
        type="search"
        defaultValue={query}
        placeholder={t("placeholder")}
        className={`rounded-lg border border-line bg-bg px-3 text-sm outline-none focus:border-muted ${compact ? "h-9 w-56" : "h-11 flex-1 text-base"}`}
      />
      <button type="submit" className={`btn ${compact ? "h-9 px-3" : "btn-primary h-11"}`}>
        {t("button")}
      </button>
    </form>
  );
}

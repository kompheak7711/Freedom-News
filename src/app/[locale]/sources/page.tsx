import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BiasLabel } from "@/components/bits";
import { Link } from "@/i18n/navigation";
import { pageMetadata } from "@/lib/seo";
import { OUTLETS, SOURCES, outletOf, sideOf } from "@/lib/sources";
import type { Bias, Side } from "@/lib/types";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ side?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return pageMetadata({ locale, path: "/sources", title: t("meta.sources"), description: t("sources.intro") });
}

const FILTERS: Array<Side | "unrated" | "all"> = ["all", "left", "center", "right", "unrated"];

export default async function SourcesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { side } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();
  const filter = FILTERS.includes(side as Side) ? (side as Side | "unrated") : "all";
  const matches = (bias: Bias) => filter === "all" || (filter === "unrated" ? sideOf(bias) === null : sideOf(bias) === filter);
  const outlets = [...OUTLETS].filter((o) => matches(o.bias)).sort((a, b) => a.name.localeCompare(b.name));
  const feedCount = (id: string) => SOURCES.filter((s) => outletOf(s) === id).length;

  return (
    <div className="space-y-6">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-black tracking-tight">{t("sources.title")}</h1>
        <p className="mt-3 text-sm text-muted">{t("sources.intro")}</p>
        <p className="mt-2 text-sm text-muted">{t("sources.unratedIntro")}</p>
      </header>
      <nav className="flex flex-wrap gap-2" aria-label={t("sources.filterBySide")}>
        {FILTERS.map((f) => (
          <Link key={f} href={f === "all" ? "/sources" : `/sources?side=${f}`} className="chip" data-active={filter === f}>
            {f === "all" ? t("sources.all") : t(`bias.${f}`)}
          </Link>
        ))}
        <span className="self-center text-sm text-muted">{t("sources.count", { count: outlets.length })}</span>
      </nav>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">{t("sources.outlet")}</th>
              <th className="px-4 py-3">{t("sources.country")}</th>
              <th className="px-4 py-3">{t("sources.language")}</th>
              <th className="px-4 py-3">{t("sources.feeds")}</th>
              <th className="px-4 py-3">{t("sources.rating")}</th>
            </tr>
          </thead>
          <tbody>
            {outlets.map((s) => (
              <tr key={s.id} className="border-b border-line last:border-b-0">
                <td className="px-4 py-2.5 font-medium">
                  <a href={s.homepage} className="hover:underline" target="_blank" rel="noopener noreferrer">
                    {s.name}
                  </a>
                </td>
                <td className="px-4 py-2.5 text-muted">{s.country}</td>
                <td className="px-4 py-2.5 text-muted">{t(`common.lang.${s.lang ?? "en"}`)}</td>
                <td className="px-4 py-2.5 text-muted">{t("sources.feedCount", { count: feedCount(s.id) })}</td>
                <td className="px-4 py-2.5">
                  <BiasLabel bias={s.bias} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

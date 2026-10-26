import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { OUTLETS } from "@/lib/sources";
import { CATEGORIES } from "@/lib/types";
import { LanguageSwitcher } from "./LanguageSwitcher";

export async function Footer() {
  const t = await getTranslations();
  return (
    <footer className="mt-12 border-t border-line bg-card">
      <div className="container-page grid gap-8 py-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <p className="text-lg font-black tracking-tight">
            Freedom<span className="text-accent">News</span>
          </p>
          <p className="mt-2 text-sm text-muted">{t("footer.tagline")}</p>
          <div className="mt-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{t("footer.language")}</p>
            <LanguageSwitcher />
          </div>
        </div>
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("footer.sections")}</h2>
          <ul className="space-y-1 text-sm">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <Link href={`/category/${c}`} className="hover:underline">
                  {t(`categories.${c}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("footer.pages")}</h2>
          <ul className="space-y-1 text-sm">
            <li><Link href="/" className="hover:underline">{t("nav.home")}</Link></li>
            <li><Link href="/for-you" className="hover:underline">{t("nav.forYou")}</Link></li>
            <li><Link href="/local" className="hover:underline">{t("nav.local")}</Link></li>
            <li><Link href="/blindspot" className="hover:underline">{t("nav.blindspot")}</Link></li>
            <li><Link href="/search" className="hover:underline">{t("nav.search")}</Link></li>
            <li><Link href="/sources" className="hover:underline">{t("nav.sources")}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("footer.howItWorks")}</h2>
          <p className="text-sm text-muted">{t("footer.howItWorksText", { outlets: OUTLETS.length })}</p>
          <p className="mt-2 text-sm text-muted">{t("footer.ratingsNote")}</p>
          <a
            href="https://github.com/kompheak7711/Freedom-News"
            className="mt-2 inline-block text-sm font-semibold text-accent hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("footer.github")}
          </a>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="container-page py-4 text-xs text-muted">{t("footer.copyright", { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}

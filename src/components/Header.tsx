import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CategoryBar } from "./CategoryBar";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";
import { SearchForm } from "./SearchForm";
import { SignInButton } from "./SignInButton";

export async function Header() {
  const t = await getTranslations("nav");
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card/95 backdrop-blur">
      <div className="container-page flex h-14 items-center gap-3 md:h-16">
        <MobileMenu />
        <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight" aria-label="Freedom News">
          <span className="inline-block h-3 w-3 rounded-sm bg-accent" aria-hidden="true" />
          Freedom<span className="text-accent">News</span>
        </Link>
        <nav className="ml-4 hidden md:block" aria-label={t("menu")}>
          <NavLinks />
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden lg:block">
            <SearchForm compact />
          </div>
          <Link href="/search" className="btn px-2 lg:hidden" aria-label={t("search")}>
            <SearchIcon />
          </Link>
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <SignInButton />
        </div>
      </div>
      <CategoryBar />
    </header>
  );
}

export function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

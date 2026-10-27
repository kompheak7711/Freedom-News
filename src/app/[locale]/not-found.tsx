import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("story");
  return (
    <div className="card mx-auto max-w-lg p-8 text-center">
      <h1 className="text-2xl font-bold">{t("notFound")}</h1>
      <p className="mt-2 text-muted">{t("notFoundText")}</p>
      <Link href="/" className="btn btn-primary mt-5">
        {t("backHome")}
      </Link>
    </div>
  );
}

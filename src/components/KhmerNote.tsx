import { getTranslations } from "next-intl/server";

/** Shown to Khmer readers when a story has English text only. */
export async function KhmerNote({ compact = false }: { compact?: boolean }) {
  const t = await getTranslations("story");
  return (
    <p className={`inline-flex items-center gap-1.5 rounded border border-dashed border-line bg-soft px-2 py-1 text-xs text-muted ${compact ? "" : "mb-3"}`}>
      <span aria-hidden="true">🌐</span>
      <span>
        {t("khmerMissing")}
        {!compact && ` · ${t("showingEnglish")}`}
      </span>
    </p>
  );
}

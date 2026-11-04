"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

/** Accounts do not exist yet: the button explains that preferences live on this device. */
export function SignInButton() {
  const t = useTranslations("account");
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const close = (e: MouseEvent) => {
      if (e.target === el) el.close();
    };
    el.addEventListener("click", close);
    return () => el.removeEventListener("click", close);
  }, []);

  return (
    <>
      {/* Icon-only on narrow phones so the header never overflows (the Khmer label is wide). */}
      <button
        type="button"
        className="btn btn-primary whitespace-nowrap max-[479px]:px-2.5"
        aria-label={t("signIn")}
        onClick={() => dialog.current?.showModal()}
      >
        <svg className="min-[480px]:hidden" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
        <span className="max-[479px]:hidden">{t("signIn")}</span>
      </button>
      <dialog ref={dialog} className="m-auto w-[min(90vw,24rem)] rounded-xl border border-line bg-card p-0 text-ink backdrop:bg-black/50">
        <div className="p-5">
          <h2 className="text-lg font-bold">{t("title")}</h2>
          <p className="mt-2 text-sm text-muted">{t("text")}</p>
          <div className="mt-4 flex justify-end">
            <button type="button" className="btn" onClick={() => dialog.current?.close()}>
              {t("close")}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

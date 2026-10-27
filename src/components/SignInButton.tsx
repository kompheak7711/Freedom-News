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
      <button type="button" className="btn btn-primary whitespace-nowrap" onClick={() => dialog.current?.showModal()}>
        {t("signIn")}
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

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

export function SectionHeading({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 border-b-2 border-ink pb-2">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {children && <p className="mt-0.5 text-sm text-muted">{children}</p>}
      </div>
      {href && linkLabel && (
        <Link href={href} className="shrink-0 text-sm font-semibold text-accent hover:underline">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

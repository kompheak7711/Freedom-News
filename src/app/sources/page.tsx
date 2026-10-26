import { BIAS_LABEL, SOURCES, sideOf } from "@/lib/sources";

export default function SourcesPage() {
  const sorted = [...SOURCES].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Sources and bias ratings</h1>
      <p className="mb-5 max-w-3xl text-sm text-[var(--muted)]">
        Each outlet has one rating, approximated from public media-bias charts such as AllSides and Ad
        Fontes Media. A story&apos;s coverage bar counts how many outlets from each side reported it.
      </p>
      <table className="w-full max-w-3xl text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
            <th className="py-2">Outlet</th>
            <th>Country</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => (
            <tr key={s.id} className="border-b border-[var(--border)]">
              <td className="py-2">
                <a href={s.homepage} className="hover:underline" target="_blank" rel="noopener noreferrer">{s.name}</a>
              </td>
              <td>{s.country}</td>
              <td>
                <span className="font-medium" style={{ color: `var(--${sideOf(s.bias)})` }}>{BIAS_LABEL[s.bias]}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

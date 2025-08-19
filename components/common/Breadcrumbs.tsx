import Link from "next/link";

type Crumb = { href: string; label: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (!items?.length) return null;
  return (
    <nav aria-label="パンくず" className="text-sm text-gray-500 mb-3">
      {items.map((c, i) => (
        <span key={c.href}>
          {i > 0 && <span className="mx-1">/</span>}
          {i < items.length - 1 ? (
            <Link className="hover:underline" href={c.href}>
              {c.label}
            </Link>
          ) : (
            <span className="text-gray-700">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

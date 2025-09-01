"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SORT_OPTIONS, parseSortKey, type SortKey } from "@/utils/sort";

export default function SortControl() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // 現在のsort値をURLから取得
  const current: SortKey = parseSortKey(sp.get("sort"));

  const handleChange = (v: string) => {
    // popular はクエリ無し、他は ?sort=...
    const next =
      v === "popular" ? pathname : `${pathname}?sort=${encodeURIComponent(v)}`;
    router.push(next);
  };

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      並び替え
      <select
        className="border rounded-md px-3 py-2 text-sm bg-white"
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        id="sort"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

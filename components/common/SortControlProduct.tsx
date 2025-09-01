"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  PRODUCT_SORT_OPTIONS,
  parseProductSortKey,
  type ProductSortKey,
} from "@/utils/sort";

export default function SortControlProduct() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const current: ProductSortKey = parseProductSortKey(sp.get("sort"));

  const onChange = (v: string) => {
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
        onChange={(e) => onChange(e.target.value)}
        id="sort"
      >
        {PRODUCT_SORT_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

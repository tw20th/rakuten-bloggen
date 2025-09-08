// hooks/useFilteredItems.ts
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { BlogType, MonitoredItemType } from "@/types";

type Item = BlogType | MonitoredItemType;

export function useFilteredItems<T extends Item>(items: T[]) {
  const params = useSearchParams();
  const tag = params.get("tag");
  const category = params.get("category");
  const sort = params.get("sort"); // "views" | "new" | "price"

  const filtered = useMemo(() => {
    let result = [...items];

    if (tag) {
      result = result.filter((item) => item.tags?.includes(tag));
    }

    if (category) {
      result = result.filter((item) => item.category === category);
    }

    if (sort === "views") {
      result.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    if (sort === "new") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt as unknown as string).getTime() -
          new Date(a.createdAt as unknown as string).getTime()
      );
    }

    if (sort === "price") {
      result.sort((a, b) => {
        const pa =
          "priceHistory" in a ? a.priceHistory?.[0]?.price ?? 999999 : 999999;
        const pb =
          "priceHistory" in b ? b.priceHistory?.[0]?.price ?? 999999 : 999999;
        return pa - pb;
      });
    }

    return result;
  }, [items, tag, category, sort]);

  return filtered;
}

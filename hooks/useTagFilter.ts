"use client";
import { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export function useTagFilter(allTags: string[]) {
  const sp = useSearchParams();
  const router = useRouter();

  const current = sp.get("tag") ?? "";
  const setTag = (tag: string) => {
    const p = new URLSearchParams(sp);
    if (tag) p.set("tag", tag);
    else p.delete("tag");
    router.push(`/product?${p.toString()}`);
  };

  const normalized = useMemo(() => current.trim(), [current]);

  const uniqueTags = Array.from(new Set(allTags)).sort();

  return { tag: normalized, setTag, tags: uniqueTags };
}

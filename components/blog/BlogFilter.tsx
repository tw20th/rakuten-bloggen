// components/blog/BlogFilter.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  currentSort: string;
  currentTag?: string;
};

export const BlogFilter = ({ currentSort }: Props) => {
  const router = useRouter();
  const params = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(params.toString());
    if (value === "") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    router.push(`/blog?${newParams.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 mb-4">
      <label className="flex items-center gap-2">
        並び順：
        <select
          value={currentSort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="newest">新着順</option>
          <option value="popular">人気順</option>
        </select>
      </label>

      {/* 今後の拡張：タグ一覧を select / チップなどで表示 */}
      {/* <label className="flex items-center gap-2">
        タグ：
        <select
          value={currentTag || ""}
          onChange={(e) => updateParam("tag", e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">すべて</option>
          <option value="大容量">大容量</option>
          <option value="軽量">軽量</option>
          ...
        </select>
      </label> */}
    </div>
  );
};

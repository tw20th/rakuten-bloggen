"use client";
import { useTagFilter } from "@/hooks/useTagFilter";

export function TagFilter({ allTags }: { allTags: string[] }) {
  const { tag, setTag, tags } = useTagFilter(allTags);
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => setTag("")}
        className={`px-3 py-1 rounded-full border ${
          !tag ? "bg-gray-900 text-white" : "hover:bg-gray-100"
        }`}
      >
        すべて
      </button>
      {tags.map((t) => (
        <button
          key={t}
          onClick={() => setTag(t)}
          className={`px-3 py-1 rounded-full border ${
            tag === t ? "bg-gray-900 text-white" : "hover:bg-gray-100"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

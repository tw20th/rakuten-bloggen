// app/blog/_components/BlogList.tsx
"use client";

import { useState } from "react";
import LoadMore from "./LoadMore";
import { BlogClient } from "@/types/blog"; // ← 型を変更！

type Props = {
  initialItems: BlogClient[];
  initialCursor?: string;
};

export default function BlogList({ initialItems, initialCursor }: Props) {
  const [blogs, setBlogs] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

  const handleLoadMore = async () => {
    if (!cursor) return;
    setLoading(true);
    const res = await fetch(`/api/blogs?cursor=${encodeURIComponent(cursor)}`);
    const data = await res.json(); // { items: BlogClient[], nextCursor }
    setBlogs((prev) => [...prev, ...data.items]);
    setCursor(data.nextCursor);
    setLoading(false);
  };

  return (
    <>
      <ul className="space-y-4">
        {blogs.map((blog) => (
          <li key={blog.slug} className="border p-4 rounded shadow-sm">
            <a
              href={`/blog/${blog.slug}`}
              className="text-lg font-semibold hover:underline"
            >
              {blog.title}
            </a>
            <p className="text-sm text-gray-500">
              {new Date(blog.createdAt).toLocaleDateString()} {/* ← ここ修正 */}
            </p>
          </li>
        ))}
      </ul>
      {cursor && (
        <div className="mt-6 text-center">
          <LoadMore onClick={handleLoadMore} loading={loading} />
        </div>
      )}
    </>
  );
}

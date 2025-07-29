// app/blog/page.tsx
import { fetchBlogsPage } from "@/lib/firestore/blogs";
import { BlogPageClient } from "./BlogPageClient";

export const revalidate = 60; // ISR：60秒ごとに再生成（任意）

export default async function BlogPage() {
  const { items, nextCursor } = await fetchBlogsPage({}); // Firestore SSR取得

  return <BlogPageClient initialItems={items} initialCursor={nextCursor} />;
}

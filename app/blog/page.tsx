// app/blog/page.tsx
import { fetchBlogsPage } from "@/lib/firestore/blogs";
import BlogList from "./_components/BlogList";

export const revalidate = 60; // ISR対応

export default async function BlogPage() {
  const { items, nextCursor } = await fetchBlogsPage({});
  return (
    <main className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">最新ブログ記事</h1>
      <BlogList initialItems={items} initialCursor={nextCursor} />
    </main>
  );
}

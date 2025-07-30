import BlogPageClient from "./BlogPageClient";
import { getInitialBlogs } from "@/lib/firestore/blogs";

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { [key: string]: string };
}) {
  const sort = (searchParams.sort as "newest" | "popular") || "newest";
  const tag = searchParams.tag || undefined;

  const { items, nextCursor } = await getInitialBlogs({ sort, tag });

  return (
    <BlogPageClient
      initialItems={items}
      initialCursor={nextCursor ?? undefined} // ← null を undefined に変換
      sort={sort}
      tag={tag}
    />
  );
}

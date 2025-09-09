import { fetchBlogsPageServer } from "@/lib/firestore/blogs";
import { BlogPageClient } from "./BlogPageClient";
import { siteConfig } from "@/site.config";

export const revalidate = 60;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { sort?: string };
}) {
  const sort =
    searchParams.sort === "popular"
      ? "popular"
      : searchParams.sort === "oldest"
      ? "oldest"
      : "newest";

  const { items, nextCursor } = await fetchBlogsPageServer({
    sort,
    pageSize: 10,
    siteKey: siteConfig.siteKey, // ★ power-post だけ取得
  });

  return (
    <BlogPageClient
      initialItems={items}
      initialCursor={nextCursor}
      initialSort={sort}
    />
  );
}

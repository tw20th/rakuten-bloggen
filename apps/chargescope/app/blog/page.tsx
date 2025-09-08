import { fetchBlogsPageServer } from "@/lib/firestore/blogs";
import { BlogPageClient } from "./BlogPageClient";

export const revalidate = 60;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { sort?: string };
}) {
  const sort = searchParams.sort === "popular" ? "popular" : "newest";
  const { items, nextCursor } = await fetchBlogsPageServer({
    sort,
    pageSize: 10,
  });

  return (
    <BlogPageClient
      initialItems={items}
      initialCursor={nextCursor}
      initialSort={sort}
    />
  );
}

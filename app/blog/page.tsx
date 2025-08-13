import { fetchBlogsPage } from "@/lib/firestore/blogs";
import { BlogPageClient } from "./BlogPageClient";

export const revalidate = 60;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { sort?: string };
}) {
  const sort = searchParams.sort === "popular" ? "popular" : "newest";
  const { items, nextCursor } = await fetchBlogsPage({ sort });

  return (
    <BlogPageClient
      initialItems={items}
      initialCursor={nextCursor}
      initialSort={sort} // ✅ 追加したので、次にこれを受け取る側も修正
    />
  );
}

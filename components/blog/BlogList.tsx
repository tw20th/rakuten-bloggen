import type { BlogClient } from "@/types";
import { BlogCard } from "./BlogCard";

type Props = { items: BlogClient[] };

export function BlogList({ items }: Props) {
  if (items.length === 0) {
    return <p className="text-gray-500 text-center">記事がまだありません。</p>;
  }
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((blog) => (
        <BlogCard key={blog.slug} blog={blog} />
      ))}
    </div>
  );
}

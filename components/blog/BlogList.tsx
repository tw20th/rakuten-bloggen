// components/blog/BlogList.tsx
import { BlogType } from "@/types";
import { BlogCard } from "@/components/blog/BlogCard";
import { FadeInOnScroll } from "@/components/common/FadeInOnScroll";

type Props = {
  blogs: BlogType[];
};

export const BlogList = ({ blogs }: Props) => {
  if (blogs.length === 0) {
    return <p className="text-gray-500">記事が見つかりませんでした。</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {blogs.map((blog, i) => (
        <FadeInOnScroll key={blog.id} delay={i * 0.05}>
          <BlogCard blog={blog} />
        </FadeInOnScroll>
      ))}
    </div>
  );
};

// components/blog/BlogCard.tsx
import Link from "next/link";
import Image from "next/image";
import type { BlogType } from "@/types/blog";
import { TagBadge } from "@/components/common/TagBadge";

type Props = {
  blog: BlogType;
};

export function BlogCard({ blog }: Props) {
  const { slug, title, imageUrl, aiSummary, tags, category } = blog;

  const summary = aiSummary || "";

  return (
    <Link
      href={`/blog/${slug}`}
      className="group block rounded-2xl overflow-hidden border bg-white hover:shadow-md transition-all"
    >
      {/* サムネイル画像 */}
      <div className="relative aspect-video w-full">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
            画像なし
          </div>
        )}
      </div>

      {/* テキストコンテンツ */}
      <div className="p-4 space-y-2">
        {/* カテゴリ・タグ */}
        <div className="flex flex-wrap gap-1 text-sm text-gray-500">
          {category && <span>{category}</span>}
          {tags.slice(0, 2).map((tag) => (
            <TagBadge key={tag} label={tag} />
          ))}
        </div>

        {/* タイトル */}
        <h3 className="text-base font-semibold leading-snug line-clamp-2 text-gray-900 group-hover:text-blue-600">
          {title}
        </h3>

        {/* 要約 */}
        {summary && (
          <p className="text-sm text-gray-600 line-clamp-3">{summary}</p>
        )}
      </div>
    </Link>
  );
}

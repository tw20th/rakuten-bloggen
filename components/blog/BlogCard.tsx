"use client";

import Link from "next/link";
import Image from "next/image";
import type { BlogClient } from "@/types";
import { Eye } from "lucide-react";

type Props = { blog: BlogClient };

function excerpt(text: string, n = 80) {
  const s = (text || "").replace(/\s+/g, " ").trim();
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export function BlogCard({ blog }: Props) {
  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="block rounded-xl border border-gray-200 hover:shadow-md transition-shadow bg-white"
    >
      {blog.imageUrl && (
        <div className="relative w-full h-48 overflow-hidden rounded-t-xl">
          <Image
            src={blog.imageUrl}
            alt={blog.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="p-4 space-y-2">
        <div className="flex flex-wrap gap-1 text-xs text-blue-600 font-medium">
          {blog.tags.map((tag) => (
            <span key={tag} className="bg-blue-100 px-2 py-0.5 rounded">
              #{tag}
            </span>
          ))}
        </div>

        <h2 className="text-lg font-semibold line-clamp-2">{blog.title}</h2>

        <p className="text-sm text-gray-600 line-clamp-2">
          {excerpt(blog.content, 100)}
        </p>

        <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
          <span>
            {blog.createdAt
              ? new Date(blog.createdAt).toLocaleDateString()
              : ""}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {blog.views ?? 0}
          </span>
        </div>
      </div>
    </Link>
  );
}

// components/ui/Markdown.tsx
"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import OutboundAffiliateLink from "@/components/common/OutboundAffiliateLink";

const detectSource = (href: string): "rakuten" | "amazon" | "yahoo" | null => {
  const h = href.toLowerCase();
  if (h.includes("rakuten")) return "rakuten";
  if (h.includes("amazon")) return "amazon";
  if (h.includes("yahoo")) return "yahoo";
  return null;
};

export default function Markdown({ content }: { content: string }) {
  return (
    <div className="prose prose-neutral max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a({ href = "", children, ...props }) {
            const source = detectSource(href);
            if (source) {
              return (
                <OutboundAffiliateLink
                  href={href}
                  source={source}
                  // productId は本文からは取得しづらいので省略（必要なら props で渡せる設計に）
                  className="text-blue-600 hover:underline"
                >
                  {children as React.ReactNode}
                </OutboundAffiliateLink>
              );
            }
            // 通常リンク
            return (
              <a
                href={href}
                {...props}
                className="text-blue-600 hover:underline"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// components/common/InfiniteScroll.tsx
"use client";

import { useEffect, useRef } from "react";

type Props = {
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  loadingText?: string;
  idleText?: string;
};

export const InfiniteScroll = ({
  isLoading,
  hasMore,
  onLoadMore,
  loadingText = "読み込み中…",
  idleText = "スクロールでさらに表示",
}: Props) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          onLoadMore();
        }
      },
      { rootMargin: "200px 0px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  if (!hasMore) return null;

  return (
    <div
      ref={sentinelRef}
      className="h-12 w-full flex items-center justify-center"
    >
      <span className="text-sm text-gray-500">
        {isLoading ? loadingText : idleText}
      </span>
    </div>
  );
};

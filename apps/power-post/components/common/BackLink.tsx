"use client";
import { useRouter } from "next/navigation";

export function BackLink({ label = "一覧へ戻る" }: { label?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
      aria-label="前のページに戻る"
    >
      ← {label}
    </button>
  );
}

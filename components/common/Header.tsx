"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn"; // なければ小ユーティリティを後述

const NAV = [
  { href: "/", label: "ホーム" },
  { href: "/product", label: "商品一覧" },
  { href: "/ranking", label: "ランキング" }, // ページ未実装でもOK（後で作る）
  { href: "/blog", label: "読みもの" },
  { href: "/tags", label: "タグ一覧" }, // 後で作る
];

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">
          ChargeScope
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "px-2 py-1 rounded hover:bg-gray-100",
                pathname === n.href && "text-blue-600 font-semibold"
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

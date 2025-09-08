"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/utils/cn";

const NAV = [
  { href: "/", label: "ホーム" },
  { href: "/product", label: "商品一覧" },
  { href: "/ranking", label: "ランキング" },
  { href: "/blog", label: "読みもの" },
  { href: "/tags", label: "タグ一覧" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Brand */}
        <Link href="/" className="font-bold text-lg tracking-tight">
          ChargeScope
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded px-3 py-2 text-sm hover:bg-gray-100",
                pathname === n.href && "font-semibold text-blue-600"
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Mobile: Hamburger */}
        <button
          aria-label="メニュー"
          className="inline-flex items-center justify-center rounded-md p-2 md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="block h-0.5 w-6 bg-gray-800" />
          <span className="mt-1 block h-0.5 w-6 bg-gray-800" />
          <span className="mt-1 block h-0.5 w-6 bg-gray-800" />
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div
          className="md:hidden"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="border-t bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="mx-auto max-w-6xl px-4 py-3">
              <ul className="space-y-1">
                {NAV.map((n) => (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      className={cn(
                        "block rounded px-3 py-2 text-base hover:bg-gray-100",
                        pathname === n.href && "font-semibold text-blue-600"
                      )}
                      onClick={() => setOpen(false)}
                    >
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

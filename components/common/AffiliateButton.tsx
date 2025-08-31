"use client";
import Link from "next/link";
import { eventAffiliateClick } from "@/lib/gtag";

type Props = {
  href: string;
  productId: string;
  label: "rakuten" | "amazon" | "yahoo";
  children: React.ReactNode;
};

export default function AffiliateButton({
  href,
  productId,
  label,
  children,
}: Props) {
  return (
    <Link
      href={href}
      prefetch={false}
      rel="nofollow sponsored noopener"
      onClick={() => eventAffiliateClick({ productId, label, url: href })}
      className="inline-flex items-center justify-center rounded-2xl px-4 py-3 font-semibold shadow-sm border hover:opacity-90"
    >
      {children}
    </Link>
  );
}

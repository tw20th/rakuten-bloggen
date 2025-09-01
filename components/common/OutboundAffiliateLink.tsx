// components/common/OutboundAffiliateLink.tsx
"use client";

import React from "react";
import { eventAffiliateClick } from "@/lib/gtag";

type Props = {
  href: string;
  source: "rakuten" | "amazon" | "yahoo";
  productId?: string;
  price?: number;
  children: React.ReactNode;
  className?: string;
  targetBlank?: boolean; // 既定は新規タブ
};

export default function OutboundAffiliateLink({
  href,
  source,
  productId,
  price,
  children,
  className,
  targetBlank = true,
}: Props) {
  const rel = "nofollow sponsored noopener";
  const target = targetBlank ? "_blank" : undefined;

  const fire = () =>
    eventAffiliateClick({ productId, label: source, url: href, price });

  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = () => {
    fire(); // 左クリック
  };

  const handleAuxClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    // 中クリック（button===1）なども計測
    if (e.button === 1) fire();
  };

  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={className}
      onClick={handleClick}
      onAuxClick={handleAuxClick}
    >
      {children}
    </a>
  );
}

// app/layout.tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SEO } from "@/components/SEO";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import Script from "next/script"; // ← 追加

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://rakuten-bloggen.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "モバイルバッテリー比較 | 価格と“ちょうどいい”を毎日更新",
    template: "%s | モバイルバッテリー比較",
  },
  description:
    "迷うポイントだけ要約。価格・在庫の変動も追跡して最適な1台を見つけます。",
  openGraph: {
    type: "website",
    siteName: "Rakuten Bloggen",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
  },
};

// ISR（1時間）
export const revalidate = 60 * 60;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <SEO />
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-8L3KN2N3E9"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-8L3KN2N3E9');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

// app/sitemap.ts
import { dbAdmin } from "@/lib/firebaseAdmin";
export default async function sitemap() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://rakuten-bloggen.vercel.app";
  const products = await dbAdmin
    .collection("monitoredItems")
    .orderBy("updatedAt", "desc")
    .limit(1000)
    .get();
  const blogs = await dbAdmin
    .collection("blogs")
    .where("status", "==", "published")
    .orderBy("updatedAt", "desc")
    .limit(1000)
    .get();

  const productUrls = products.docs.map((d) => ({
    url: `${base}/product/${d.id}`,
    lastModified: (d.data().updatedAt?.toDate?.() ?? new Date()).toISOString(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const blogUrls = blogs.docs.map((d) => ({
    url: `${base}/blog/${d.data().slug}`,
    lastModified: (d.data().updatedAt?.toDate?.() ?? new Date()).toISOString(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [
    {
      url: base,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    ...productUrls,
    ...blogUrls,
  ];
}

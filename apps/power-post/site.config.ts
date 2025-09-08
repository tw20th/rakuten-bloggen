// apps/power-post/site.config.ts
export type CategoryKey =
  | "battery"
  | "chair"
  | "camera"
  | "smartlock"
  | "audio"
  | "mattress";

export const siteConfig = {
  siteKey: "power-post" as const, // ← 追加（このサイトの識別子）
  defaultCategory: "battery" as CategoryKey, // ← 明示しておく（防災バッテリー）
  name: "PowerPost",
  baseUrl: "https://www.power-post.jp",
  brand: {
    title: "PowerPost",
    description: "“ちょうどいい”を毎日更新",
  },
};

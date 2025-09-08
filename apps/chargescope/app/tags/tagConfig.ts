// app/tags/tagConfig.ts
export type TagKey = "lightweight" | "large-capacity" | "fast-charge";

export type TagDef = {
  key: TagKey;
  label: string; // 表示名（日本語）
  firestoreTag: string; // Firestore の tags[] に入っている値
  description: string;
  icon: "feather" | "battery" | "zap";
};

export const TAGS: Record<TagKey, TagDef> = {
  lightweight: {
    key: "lightweight",
    label: "軽い",
    firestoreTag: "軽量",
    description: "持ち運びが楽で普段使いに最適な軽量モデル。",
    icon: "feather",
  },
  "large-capacity": {
    key: "large-capacity",
    label: "大容量",
    firestoreTag: "大容量",
    description: "長時間の外出や旅行でも安心の大容量モデル。",
    icon: "battery",
  },
  "fast-charge": {
    key: "fast-charge",
    label: "急速",
    firestoreTag: "急速充電",
    description: "短時間でしっかり充電。PD対応などの急速充電モデル。",
    icon: "zap",
  },
};

export const TAG_ORDER: TagKey[] = [
  "lightweight",
  "large-capacity",
  "fast-charge",
];

// ?tag= の値（キー）を厳密判定
export const parseTagKey = (slug: string | null): TagKey | undefined => {
  if (!slug) return undefined;
  const s = slug.trim() as TagKey;
  return (Object.keys(TAGS) as TagKey[]).find((k) => k === s);
};

// 互換: 古い短縮形（light/large/fast）や日本語を受けたらキーに寄せる
export const normalizeToTagKey = (raw: string | null): TagKey | undefined => {
  if (!raw) return undefined;
  const m = raw.trim().toLowerCase();
  if (parseTagKey(m)) return m as TagKey;
  if (["light", "軽量", "軽い"].includes(m)) return "lightweight";
  if (["large", "capacity", "大容量"].includes(m)) return "large-capacity";
  if (["fast", "急速", "急速充電", "pd"].includes(m)) return "fast-charge";
  return undefined;
};

// Firestore に保存されている日本語タグへ変換
export const toFirestoreTag = (key: TagKey): string => TAGS[key].firestoreTag;

// ヘッダーのクイックリンク用（人気順に差し替える場合はここだけ更新）
export const QUICK_FILTER_LINKS = TAG_ORDER.map((key) => ({
  key,
  label: TAGS[key].label,
  href: `/product?tag=${key}`,
}));

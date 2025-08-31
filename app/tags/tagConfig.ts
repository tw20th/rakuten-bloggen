// app/tags/tagConfig.ts
export type TagKey = "lightweight" | "large-capacity" | "fast-charge";

export type TagDef = {
  key: TagKey;
  label: string; // 表示名（日本語）
  firestoreTag: string; // Firestoreの tags[] に入っている値
  description: string; // 簡単な説明（SEO/導線用）
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

// スラッグからTagKeyを取得（無効値はundefined）
export const parseTagKey = (slug: string): TagKey | undefined => {
  const keys = Object.keys(TAGS) as TagKey[];
  return keys.find((k) => k === slug);
};

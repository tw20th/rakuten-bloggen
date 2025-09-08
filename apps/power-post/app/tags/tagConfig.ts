// apps/power-post/app/tags/tagConfig.ts
export type TagKey =
  | "long-runtime" // 長時間給電
  | "solar-handcrank" // ソーラー/手回し
  | "fast-charge" // 急速充電
  | "lightweight"; // 軽量

export type TagDef = {
  key: TagKey;
  label: string;
  firestoreTag: string; // Firestore の tags[] と一致させる
  description: string;
  icon: "battery" | "zap" | "feather"; // 既存アイコン種別に合わせる
};

export const TAGS: Record<TagKey, TagDef> = {
  "long-runtime": {
    key: "long-runtime",
    label: "長時間",
    firestoreTag: "長時間給電", // Firestore 側の表記に合わせて変更OK
    description: "停電が長引いても安心の大容量・高効率モデル。",
    icon: "battery",
  },
  "solar-handcrank": {
    key: "solar-handcrank",
    label: "ソーラー/手回し",
    firestoreTag: "ソーラー・手回し",
    description: "電源がなくても発電できる非常時向けモデル。",
    icon: "battery",
  },
  "fast-charge": {
    key: "fast-charge",
    label: "急速",
    firestoreTag: "急速充電",
    description: "短時間で必要量を確保。PD/QC対応など。",
    icon: "zap",
  },
  lightweight: {
    key: "lightweight",
    label: "軽量",
    firestoreTag: "軽量",
    description: "持ち出しやすく避難バッグにも入れやすい。",
    icon: "feather",
  },
};

export const TAG_ORDER: TagKey[] = [
  "long-runtime",
  "solar-handcrank",
  "fast-charge",
  "lightweight",
];

// ?tag= の厳密判定
export const parseTagKey = (slug: string | null): TagKey | undefined => {
  if (!slug) return undefined;
  const s = slug.trim() as TagKey;
  return (Object.keys(TAGS) as TagKey[]).find((k) => k === s);
};

// 互換: 日本語や短縮系をキーに寄せる
export const normalizeToTagKey = (raw: string | null): TagKey | undefined => {
  if (!raw) return undefined;
  const m = raw.trim().toLowerCase();
  if (parseTagKey(m)) return m as TagKey;
  if (["長時間", "long", "runtime"].includes(m)) return "long-runtime";
  if (["ソーラー", "solar", "手回し", "handcrank"].includes(m))
    return "solar-handcrank";
  if (["fast", "急速", "急速充電", "pd", "qc"].includes(m))
    return "fast-charge";
  if (["軽量", "軽い", "light"].includes(m)) return "lightweight";
  return undefined;
};

export const toFirestoreTag = (key: TagKey): string => TAGS[key].firestoreTag;

export const QUICK_FILTER_LINKS = TAG_ORDER.map((key) => ({
  key,
  label: TAGS[key].label,
  href: `/product?tag=${key}`,
}));

// functions/src/utils/classifyCategory.ts
import type { Category } from "../types/monitoredItem";

export type CategoryInput = {
  itemName: string;
  description: string;
  capacity: number | null;
  outputPower: number | null;
};

const re = {
  // ノイズを先に落とす
  other:
    /(扇風機|ファン|ベスト|ジャケット|ウェア|空調服|冷蔵服|ヒーター|加熱|ライト|ランタン|照明|ソーラー(ライト|ランタン|充電器?)|ラジオ|ケース|ポーチ|ホルダー)/i,
  cable:
    /(ケーブル|コード|3\s?in\s?1|3[-\s]?in[-\s]?1|延長ケーブル|変換ケーブル|Lightning\s*cable|USB[-\s]?C\s*cable|Type[-\s]?C\s*ケーブル)/i,
  adapter:
    /(充電器|チャージャー|ACアダプタ|ACアダプター|アダプタ(ー)?|壁充電器|卓上充電器|車載(充電器|チャージャー)|カーチャージャー)/i,

  // battery 判定用
  mAh: /\b\d{3,6}\s?mAh\b/i,
  powerBank: /\bpower\s*bank\b/i,
  mobileBattery: /モバイル\s*バッテ(リー|リ)/i,
};

const has = (s: string, r: RegExp) => r.test(s);

export function classifyCategory(input: CategoryInput): Category {
  const text = `${input.itemName} ${input.description}`;

  // 1) アクセ＆雑貨を先に確定
  if (has(text, re.other)) return "other";
  if (has(text, re.cable)) return "cable";
  if (has(text, re.adapter)) return "adapter";

  // 2) battery は「mAh か 'power bank'」を強シグナルに。
  //    ただしケーブル/アダプタ/他の語が混在したら除外
  const hasMah =
    (typeof input.capacity === "number" && input.capacity > 0) ||
    has(text, re.mAh);
  const batteryWord = has(text, re.powerBank) || has(text, re.mobileBattery);

  if (
    (hasMah || batteryWord) &&
    !has(text, re.cable) &&
    !has(text, re.adapter) &&
    !has(text, re.other)
  ) {
    return "battery";
  }

  // 3) それでも決め打てないものは other
  return "other";
}

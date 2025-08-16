// functions/src/utils/slugify.ts
/**
 * ざっくり英数ベースのスラッグを作る。
 * - 日本語は削除（今回はローマ字化しない）
 * - 連続ハイフン圧縮、前後ハイフン除去
 * - 最低長(8)を満たさない場合は caller 側でフォールバックを併合
 */
export function basicSlug(input: string): string {
  const base = (input ?? "")
    .normalize("NFKC")
    .toLowerCase()
    // 空白と下線をハイフンに
    .replace(/[\s_]+/g, "-")
    // 英数・ハイフン以外を除去
    .replace(/[^a-z0-9-]/g, "")
    // 連続ハイフンを1つに
    .replace(/-+/g, "-")
    // 先頭末尾のハイフン除去
    .replace(/^-|-$/g, "");
  return base;
}

/** itemCode から安全な尾部を作る（例：backyard-1:10010047 → backyard-1-10010047） */
export function safeTailFromItemCode(itemCode: string): string {
  return (itemCode ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** 32-bit 簡易ハッシュ → base36 短縮ID */
export function shortId(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
  }
  // 符号なし化して base36
  return (h >>> 0).toString(36).slice(0, 5);
}

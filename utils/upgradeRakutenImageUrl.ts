// utils/upgradeRakutenImageUrl.ts
/**
 * Rakutenの画像URLを高解像度にする。
 * - 末尾の "?_ex=WxH" を指定サイズに置換（無ければ追加）
 * - 実表示幅の2倍程度を渡すとボケにくい
 */
export function upgradeRakutenImageUrl(
  url: string | null | undefined,
  size = 800
): string {
  if (!url) return "";
  const ex = `_ex=${size}x${size}`;
  if (url.includes("?_ex=") || url.includes("&_ex=")) {
    return url.replace(/([?&])_ex=\d+x\d+/i, `$1${ex}`);
  }
  return url.includes("?") ? `${url}&${ex}` : `${url}?${ex}`;
}

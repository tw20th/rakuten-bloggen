// functions/src/services/imageUrl.ts
/** 楽天・Amazonの小さいサムネURLを高解像度版に昇格させる */
export function upgradeProductImageUrl(url: string): string {
  if (!url) return url;

  let out = url;

  // 楽天: 末尾に ?_ex=128x128 等が付く → 1200x1200 に昇格
  // 例: https://image.rakuten.co.jp/.../img.jpg?_ex=128x128
  out = out.replace(/(\?|&)?_ex=\d+x\d+/, (m, q) => `${q || "?"}_ex=1200x1200`);

  // 楽天の別パターン（サムネ生成CDN）
  // ?fitin=... はそのままでもOKだが、なければ付けない
  // ここでは明示しない（過剰変換を避ける）

  // Amazon: ..._AC_SX75_ / _SL75_ 等 → _SL1200_ に昇格
  // 例: https://m.media-amazon.com/images/I/xxxxx._AC_SL75_.jpg
  out = out.replace(/\._AC_[A-Z]*?S[XL]\d+_\.jpg/i, (m) =>
    m.replace(/S[XL]\d+/, "SL1200"),
  );
  out = out.replace(/\._SL\d+_\.jpg/i, "._SL1200_.jpg");

  // 汎用: 非jpgでもクエリに ?w= / ?width= があれば 1200
  out = out.replace(
    /([?&])(w|width|h|height)=\d+/gi,
    (m, sep, key) => `${sep}${key}=1200`,
  );

  return out;
}

export const dynamic = "force-static";

export default function Page() {
  return (
    <main className="prose mx-auto px-4 py-10">
      <h1>編集ポリシー / レビュー基準</h1>
      <p>
        ChargeScope
        は「悩み解決×比較×一次情報」を軸に、以下の方針で記事を制作します。
      </p>
      <h2>選定基準</h2>
      <ul>
        <li>安全性・コスパ・用途適合（容量/重量/出力）の観点で点数化</li>
        <li>仕様は一次ソース（メーカー/EC）の記載を優先し相互照合</li>
      </ul>
      <h2>検証・一次情報</h2>
      <ul>
        <li>実測（重量/サイズ/充電時間）の記録を記事に明記</li>
        <li>撮影写真には撮影日・機材・補正有無を注記</li>
      </ul>
      <h2>アフィリエイトと透明性</h2>
      <p>
        当サイトは購入により報酬を得る場合がありますが、掲載順位や評価には影響しません。
      </p>
      <h2>問い合わせ</h2>
      <p>改善要望はContactよりお気軽にどうぞ。</p>
    </main>
  );
}

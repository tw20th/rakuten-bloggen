export default function Footer() {
  return (
    <footer className="mt-10 border-t">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-gray-500 grid gap-4 md:grid-cols-3">
        <div>
          <div className="font-semibold text-gray-700">ChargeScope</div>
          <p className="mt-2">
            モバイルバッテリーの価格と“ちょうどいい”を毎日更新。
          </p>
        </div>
        <div>
          <div className="font-semibold text-gray-700">ナビゲーション</div>
          <ul className="mt-2 space-y-1">
            <li>
              <a href="/product" className="hover:underline">
                商品一覧
              </a>
            </li>
            <li>
              <a href="/blog" className="hover:underline">
                読みもの
              </a>
            </li>
            <li>
              <a href="/tags" className="hover:underline">
                タグ一覧
              </a>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-gray-700">運営情報</div>
          <p className="mt-2">© {new Date().getFullYear()} ChargeScope</p>
        </div>
      </div>
    </footer>
  );
}

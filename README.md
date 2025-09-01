This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## ✅ 開発前チェックリスト

- Firestore の構造と必須フィールドを確認する
- 画像ドメイン設定（next.config.mjs）を確認する
- Firebase Admin 初期化済みか確認する
- 各ページが想定データで動作するか確認する

🛠 Vercel で Firebase Functions を除外する
このプロジェクトでは functions/ 以下に Firebase Functions を配置していますが、Vercel のビルド対象に含める必要はありません。

✅ 対応方法
プロジェクトルートに .vercelignore を作成し、以下を記述します：

functions/
これで Vercel のデプロイ時に functions/ ディレクトリが無視され、不要なビルドエラーを防げます。

❌ 注意
vercel.json に excludeFiles を書くのは非対応なので使わないでください。

rakuten-bloggen / Functions README

目的：最小運用コストで、毎日コンテンツ生成 → 公開 → 最適化を回しつつ、将来は Amazon API を統合してマルチ ASP 価格比較に拡張する。

1. 現在の構成（v1 Functions / asia-northeast1）

すべて asia-northeast1 に統一（HTTP も Pub/Sub も）

Secrets は functions/src/config/secrets.ts（defineSecret）で管理

RAKUTEN_APPLICATION_ID, RAKUTEN_AFFILIATE_ID, OPENAI_API_KEY,
SERVICE_ACCOUNT_KEY, REVALIDATE_ENDPOINT, REVALIDATE_SECRET

ディレクトリ（主要）
functions/
src/
adapters/ # 各ソースの取得アダプタ（rakuten, amazon(空)）
config/ # secrets など
http/ # HTTP ハンドラ
links/ # 内部リンク/関連記事生成
normalize/ # 取得 →catalogItems への正規化
optimizer/optimize/ # タイトル AB 回転 etc.
scheduler/ # Pub/Sub スケジュール呼び出し
scripts/ # バッチ/メンテ/品質監査
seo/ # OGP/構造化/ISR
types/ # Firestore 型
utils/ # 共通ロジック
lib/ # Firebase/OpenAI ラッパ
index.ts # エクスポート/スケジューラ定義

Firestore コレクション（抜粋）

rakutenItems：楽天 API の生データ

catalogItems：正規化された共通商品モデル（将来 Amazon/Yahoo もここへ）

monitoredItems：表示用の最小データ＋ offers[]想定

blogs：生成記事（status: draft|published、relatedItemCode、jsonLd 等）

\_locks：分散ロック (blog:{itemCode} など)

2. 毎日の自動処理（スケジュール）
   関数名 時刻 (JST) 種別 役割
   fetchDailyItems 06:00 Pub/Sub 楽天から新着を取得 → rakutenItems 保存
   scheduledFilterItems 06:10 Pub/Sub スペック抽出・タグ付与 → monitoredItems 更新
   normalizeItems 07:00 Pub/Sub 各アダプタ出力を catalogItems に正規化・価格履歴
   scheduledBlogMorning 12:00 Pub/Sub 新着から 1 件ブログ生成（ドラフト）＋ ISR
   runPublishScheduler 12:05 Pub/Sub 古いドラフトから 2 件 公開＋ OGP/構造化/ISR
   scheduledBlogEvening 18:50 Pub/Sub 夕方もブログ生成（ドラフト）＋ ISR
   runPublishSchedulerEvening 19:05 Pub/Sub 夕方も 2 件 公開
   runRelatedContentWriter 21:00 Pub/Sub 関連リンク更新（50 件）
   runTitleAbGenerator 23:00 Pub/Sub タイトル AB 案を生成（30 件）
   runRotateAbTitle 23:05 Pub/Sub AB タイトル回転（簡易ロック付き）＋ ISR
   scheduledBackfillMonitored 02:00 Pub/Sub monitored の欠損埋め（5000 件）
   scheduledDataQuality 23:15 Pub/Sub データ品質チェック（監査レポ）

分散ロック：generateBlogFromItem 内で \_locks/blog:{itemCode} を利用し、二重生成を防止。

3. 手動トリガ（HTTP）
   エンドポイント 用途
   fetchRakutenItemsFunc 楽天の取得を即時実行
   generateBlogFromItemFunc ?itemCode=... から単発生成
   generateSummaryFromHighlightsFunc 要約再生成
   fillMissingAffiliateUrlsFunc アフィ URL の補完
   manualPublish ドラフト 1 本を即時公開

-------------------------------------------------------------9/1--------------------------

# Amazon API 導入の段取り（実装順）

1. 資格情報の準備・保管

- PA-API v5 のアクセスキー/シークレット、AssociateTag（`xxxx-22` など）を取得。
- **Firebase Secret Manager**（推奨）か `functions:config:set` に保存

  - `amazon.key` / `amazon.secret` / `amazon.tag` / `amazon.locale=JP` / `amazon.partner=webservices.amazon.co.jp`

2. クライアント実装（utils/paapi.ts）

- 公式 SDK or 署名実装で **SearchItems / GetItems** を叩く薄いラッパーを作成。
- 共通の **レート制御**（直列化 + 失敗時の指数バックオフ）を必ず入れる。
- 返却 JSON は生で返さず、**adapter** に渡すだけにする。

3. アダプタ実装（normalize 層）

- `utils/adapters/amazon.ts` を作成して、PA-API レスポンス → 共通モデルへ変換。

  - `ASIN → sku`
  - `ItemInfo.Title.DisplayValue → productName`
  - `ByLineInfo.Brand.DisplayValue → brand`
  - `Images.Primary.Large.URL → imageUrl`
  - `Offers.Listings[0].Price.Amount → price`
  - `Offers.Listings[0].Availability.MaxOrderQuantity/IsBuyBoxWinner 等 → inStock`（なければ `Availability.Message` を簡易判定）
  - `DetailPageURL + associateTag → affiliate URL`（`https://www.amazon.co.jp/dp/ASIN?tag=xxxx-22` を基本に）

- 共通 Offer へ：

  ```ts
  const offer: Offer = {
    source: "amazon",
    price,
    url: detailUrlWithTag,
    fetchedAt: new Date().toISOString(),
    inStock,
  };
  ```

4. 取得スクリプト（functions/src/scripts/fetchAmazonItems.ts）

- Seed の作り方は 2 通り：

  - a) 既存 `monitoredItems` のタイトル/JAN/型番から **SearchItems** → ASIN 確定後に **GetItems**。
  - b) 監視したい ASIN リストを持っているなら **GetItems** 直。

- 保存ロジック：既存 `monitoredItems/{docId}` を開き、`offers` に `offer(source:"amazon")` を **マージ**。`updatedAt` 更新。
- 画像・タイトルなどが空なら上書き、既に値があれば維持（空潰しのみに変更）。

5. 価格履歴・ポリシー対応

- **Amazon の価格/在庫は 24 時間以上の保存・表示 NG**のため、下記を徹底：

  - `priceHistory` に **amazon ソースは入れても 24h で自動パージ**（夜間の cron で `source==="amazon" && fetchedAt < now-24h` を削除）。
  - 画面には「Amazon 価格は ○ 時点」と **タイムスタンプ表示**（既に `fetchedAt` があるので簡単）。
  - 過去グラフは楽天/Yahoo 中心。Amazon は“最新値のみ”の扱いにする。

- 既存の最安判定は `offers` の現在値で OK（履歴は不要）。

6. UI は最小変更で OK（もう “offers 優先” 化済み）

- 追加でやると良い微調整：

  - CTA ラベルをソースごとに出し分け（Prime バッジ等が取れれば表示）。
  - 価格の下に「更新: HH\:mm」表示。
  - AdDisclosure に「Amazon アソシエイトで収益を得ています」を明記（済ならスルー）。

7. スケジューラ & フォールバック

- Cloud Scheduler：朝/夕の 2 回 `fetchAmazonItems` を実行。
- 失敗時はログ + Slack 通知（既存の `alerts.ts` にフック）。
- 楽天/Yahoo が取れていれば UI は壊れないので、Amazon 失敗時も静かにスキップ。

8. 同一商品の突合（後追いでも可）

- `normalizeItems.ts` に **JAN/EAN/型番 + brand + タイトル類似度** でマージするルールを追加。
- 既存 `sku` を **ASIN 優先** に切替（なければ旧 `itemCode`）。
- 重複が出たらマージして `offers` を統合。

9. 運用・監視

- API クォータ/スロットリングのメトリクスをログ化。429 や署名エラーは回数集計。
- コンバージョン 3 件/180 日ルール維持のため、**Amazon 流入をダッシュボードで可視化**。
- 価格ゼロや URL 欠落を Daily で検知してリスト化。

10. 仕上げ（テンプレ化）

- `.env.sample` / Secrets のキー名を固定化。
- Cloud Scheduler ジョブ、Functions のソース 3 ファイル（client, adapter, fetcher）をテンプレとして他サイトへコピペ。
- AssociateTag をサイトごとに差し替えるだけで量産できる状態に。

---

### 最小実装で必要な新規ファイル/変更点まとめ

- `utils/paapi.ts`（API クライアント）
- `utils/adapters/amazon.ts`（→ Offer/Catalog 変換）
- `functions/src/scripts/fetchAmazonItems.ts`（取得＆保存）
- `functions/src/scripts/cron/purgeAmazonHistory.ts`（24h パージ）
- （既存）`normalizeItems.ts` に突合ロジック追記

この順で進めれば、**導入 → 表示 → ポリシー準拠 → 量産**までノンストップで到達できます。
どこから手を付けるか決めたら、そのファイルの雛形を即出します！
-------------------------------------------------------------9/1--------------------------

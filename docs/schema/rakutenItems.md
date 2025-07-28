# rakutenItems コレクション構成

## ドキュメント ID

- itemCode（楽天 API の商品コード）

# 🔹 rakutenItems コレクション構成

| フィールド名  | 型                        | 説明                            |
| ------------- | ------------------------- | ------------------------------- |
| itemCode      | string                    | 楽天商品コード                  |
| itemName      | string                    | 楽天商品名（元のタイトル）      |
| shortTitle    | string                    | タイトルから抽出した短縮名      |
| itemPrice     | number                    | 現在の価格（itemPrice）         |
| affiliateUrl  | string                    | 楽天アフィリエイト URL          |
| imageUrl      | string                    | 商品画像 URL（メイン）          |
| description   | string                    | 商品説明（HTML またはテキスト） |
| shopName      | string                    | 店舗名                          |
| reviewAverage | number                    | レビュー平均                    |
| reviewCount   | number                    | レビュー件数                    |
| capacity      | number（未抽出なら省略）  | 容量（mAh）                     |
| outputPower   | number（未抽出なら省略）  | 出力（W）                       |
| weight        | number（未抽出なら省略）  | 重さ（g）                       |
| hasTypeC      | boolean（未抽出なら省略） | Type-C 対応かどうか             |
| createdAt     | Timestamp                 | 初回取得日時（自動設定）        |
| updatedAt     | Timestamp                 | 最終更新日時（自動更新）        |

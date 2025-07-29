# monitoredItems コレクション構成

## ドキュメント ID

- itemCode（rakutenItems と同じ）

## ◆ monitoredItems コレクション構成

| フィールド名      | 型                         | 説明                                         |
| ----------------- | -------------------------- | -------------------------------------------- |
| productName       | string                     | 商品名（shortTitle 由来）                    |
| imageUrl          | string                     | メイン画像 URL                               |
| price             | number                     | 現在の価格（itemPrice と同値）               |
| capacity          | number（未抽出なら省略）   | 容量（mAh）                                  |
| outputPower       | number（未抽出なら省略）   | 出力（W）                                    |
| weight            | number（未抽出なら省略）   | 重さ（g）                                    |
| hasTypeC          | boolean（未抽出なら省略）  | Type-C 対応かどうか                          |
| tags              | string[]                   | 抽出された特徴タグ（itemFilterRules による） |
| category          | string                     | 商品カテゴリ（手動またはルールにより分類）   |
| views             | number                     | 表示回数（人気順ソートなどで使用）           |
| featureHighlights | string[]（未抽出なら省略） | 特徴の要点（AI 要約用の元データ）            |
| aiSummary         | string（空文字でも OK）    | AI による商品要約（generatedAiSummary）      |
| priceHistory      | Array<{date, price}>       | 日次で記録した価格履歴                       |
| affiliateUrl      | string                     | アフィリエイトリンク                         |
| createdAt         | Timestamp                  | 初回生成日時（rakutenItems 由来）            |
| updatedAt         | Timestamp                  | 最終更新日時（自動更新）                     |

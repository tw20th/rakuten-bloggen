# Firestore コレクション構成: rakutenItems

楽天 API から取得した商品情報を格納するコレクション。比較・記事生成の元データ。

## フィールド一覧

| フィールド名    | 型                      | 説明                                 |
| --------------- | ----------------------- | ------------------------------------ |
| `itemCode`      | `string`                | 楽天の商品コード（ユニーク）         |
| `itemName`      | `string`                | 商品名（フル名称）                   |
| `shortTitle`    | `string`                | サイト上で使う短縮タイトル           |
| `displayName`   | `string`                | 表示用の商品名（任意）               |
| `itemPrice`     | `number`                | 現在の価格                           |
| `priceHistory`  | `number[]`              | 過去の価格履歴（数値配列）           |
| `affiliateUrl`  | `string`                | アフィリエイトリンク（楽天）         |
| `imageUrl`      | `string`                | 商品画像 URL                         |
| `description`   | `string`                | 商品説明文（楽天 API 由来）          |
| `shopName`      | `string`                | 販売ショップ名                       |
| `reviewAverage` | `number`                | レビュー平均点                       |
| `reviewCount`   | `number`                | レビュー件数                         |
| `capacity`      | `number`                | 容量（mAh など）                     |
| `weight`        | `number`                | 重さ（g など）                       |
| `outputPower`   | `number`                | 出力（W など）                       |
| `hasTypeC`      | `boolean`               | Type-C 対応かどうか                  |
| `tags`          | `string[]`              | 自動 or 手動で生成されたタグ群       |
| `createdAt`     | `Timestamp`             | Firestore 登録日時                   |
| `updatedAt`     | `Timestamp` or `string` | Firestore 更新日時 or ISO 文字列形式 |

## TypeScript 型定義

```ts
export type RakutenItem = {
  itemCode: string;
  itemName: string;
  shortTitle: string;
  displayName?: string;
  itemPrice: number;
  priceHistory: number[];
  affiliateUrl: string;
  imageUrl: string;
  description: string;
  shopName: string;
  reviewAverage: number;
  reviewCount: number;
  capacity: number;
  weight: number;
  outputPower: number;
  hasTypeC: boolean;
  tags?: string[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp | string;
};
```

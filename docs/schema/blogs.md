## フィールド一覧

| フィールド名      | 型                         | 説明                                   |
| ----------------- | -------------------------- | -------------------------------------- |
| `slug`            | `string`                   | URL として使うスラッグ                 |
| `title`           | `string`                   | 記事タイトル                           |
| `content`         | `string`                   | Markdown 本文 or HTML など             |
| `status`          | `"draft"` \| `"published"` | 下書き or 本公開（初期値は `"draft"`） |
| `relatedItemCode` | `string`                   | 関連する楽天アイテムの `itemCode`      |
| `summary?`        | `string`                   | 要約文（分析用）省略可                 |
| `analysisHistory` | `AnalysisEntry[]`          | 分析ログ（スコアや改善案）を任意保存   |
| `createdAt`       | `Timestamp`                | 作成日時（Firestore）                  |
| `updatedAt`       | `Timestamp` or `string`    | 更新日時（任意）                       |

## TypeScript 型定義

```ts
export type Blog = {
  slug: string;
  title: string;
  content: string;
  status: "draft" | "published";
  relatedItemCode: string;
  summary?: string;
  analysisHistory?: AnalysisEntry[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp | string;
};
```

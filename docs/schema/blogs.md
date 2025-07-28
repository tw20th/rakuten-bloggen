# blogs コレクション構成

## ドキュメント ID

- slug（URL 用に使われる）

## フィールド一覧

| フィールド名    | 型                    | 説明                                              |
| --------------- | --------------------- | ------------------------------------------------- |
| title           | string                | 記事タイトル                                      |
| content         | string                | 記事本文（Markdown 形式）                         |
| aiSummary       | string                | 記事要約（AI による自動生成）                     |
| imageUrl        | string                | メイン画像 URL（楽天商品画像）                    |
| tags            | string[]              | 記事に関連するタグ一覧                            |
| productId       | string                | 紐づく商品 ID（monitoredItems のドキュメント ID） |
| createdAt       | Timestamp             | 作成日時                                          |
| updatedAt       | Timestamp             | 最終更新日時                                      |
| status          | "draft" / "published" | 公開状態（下書き or 公開）                        |
| analysisHistory | AnalysisResult[]      | 構成分析の履歴（スコア・改善提案など）            |

### AnalysisResult 型（配列）

| フィールド名     | 型        | 説明                              |
| ---------------- | --------- | --------------------------------- |
| score            | number    | 分析スコア（例：85）              |
| suggestedTitle   | string    | 提案されたタイトル                |
| suggestedOutline | string    | 提案された構成（Markdown 見出し） |
| createdAt        | Timestamp | 分析日時                          |

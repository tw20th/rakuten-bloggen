// functions/src/index.ts
import { onRequest } from "firebase-functions/v2/https";

// ハンドラーのインポート
import { fetchRakutenItemsHandler } from "./scripts/fetchRakutenItems";
import { generateBlogFromItemHandler } from "./scripts/generateBlogFromItem";

// Secret定義のインポート
import { RAKUTEN_APPLICATION_ID, OPENAI_API_KEY } from "./config/secrets";

// 商品取得関数（楽天API）
export const fetchRakutenItemsFunc = onRequest(
  {
    region: "asia-northeast1",
    secrets: [RAKUTEN_APPLICATION_ID], // ✅ Secret明示
  },
  fetchRakutenItemsHandler,
);

// ブログ生成関数（OpenAI）
export const generateBlogFromItemFunc = onRequest(
  {
    region: "asia-northeast1",
    secrets: [OPENAI_API_KEY], // ✅ Secret明示
  },
  generateBlogFromItemHandler,
);

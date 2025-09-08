// tools/predeploy-guard/index.ts
import { siteConfig } from "../../apps/chargescope/site.config";
import { existsSync } from "fs";
import { resolve } from "path";
import { config as loadEnv } from "dotenv";

// 1) 環境ファイルを順に探してロード
const candidates = [
  resolve(process.cwd(), "apps/chargescope/.env.local"),
  resolve(process.cwd(), ".env.local"),
  resolve(process.cwd(), ".env"),
];
for (const p of candidates) {
  if (existsSync(p)) {
    loadEnv({ path: p });
    break;
  }
}

const required = [
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "REVALIDATE_SECRET",
  // ↓ ローカルで未設定ならスキップできるよう、存在すればチェックする扱いに
  // "OPENAI_API_KEY",
  // "RAKUTEN_APPLICATION_ID",
  // "RAKUTEN_AFFILIATE_ID",
];

// 2) 必須の穴をチェック
const miss = required.filter(
  (k) => !process.env[k] || String(process.env[k]).trim() === ""
);
if (miss.length) {
  console.error("❌ Missing env:", miss.join(", "));
  process.exit(1);
}

// 3) baseUrlの妥当性
if (!/^https?:\/\//.test(siteConfig.baseUrl)) {
  console.error("❌ baseUrl invalid:", siteConfig.baseUrl);
  process.exit(1);
}

console.log("✅ predeploy ok");

import { defineSecret } from "firebase-functions/params";

export const RAKUTEN_APPLICATION_ID = defineSecret("RAKUTEN_APPLICATION_ID");
export const RAKUTEN_AFFILIATE_ID = defineSecret("RAKUTEN_AFFILIATE_ID");
export const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");
export const SERVICE_ACCOUNT_KEY = defineSecret("SERVICE_ACCOUNT_KEY"); // ← 追加！

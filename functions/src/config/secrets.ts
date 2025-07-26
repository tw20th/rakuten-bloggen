// functions/src/config/secrets.ts
import { defineSecret } from "firebase-functions/params";

export const RAKUTEN_APPLICATION_ID = defineSecret("RAKUTEN_APPLICATION_ID");
export const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

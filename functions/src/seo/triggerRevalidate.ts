// functions/src/seo/triggerRevalidate.ts
import * as logger from "firebase-functions/logger";
import { REVALIDATE_ENDPOINT, REVALIDATE_SECRET } from "../config/secrets";

// 例: REVALIDATE_ENDPOINT = https://rakuten-bloggen.vercel.app/api/revalidate
export async function revalidate(path: string) {
  const endpoint = REVALIDATE_ENDPOINT.value();
  const secret = REVALIDATE_SECRET.value();

  if (!endpoint || !secret) {
    logger.warn("Revalidate secrets missing. skip.", {
      endpoint: !!endpoint,
      secret: !!secret,
    });
    return;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret, path }),
  });
  const txt = await res.text();
  logger.info("revalidate", { path, status: res.status, body: txt });
}

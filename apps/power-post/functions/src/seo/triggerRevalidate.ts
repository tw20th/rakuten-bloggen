// functions/src/seo/triggerRevalidate.ts
import * as logger from "firebase-functions/logger";
import { REVALIDATE_ENDPOINT, REVALIDATE_SECRET } from "../config/secrets";

export async function revalidate(path: string) {
  const endpoint = REVALIDATE_ENDPOINT.value();
  const secret = REVALIDATE_SECRET.value();
  if (!endpoint || !secret) {
    logger.warn("Revalidate secrets missing. skip.", {
      hasEndpoint: !!endpoint,
      hasSecret: !!secret,
    });
    return;
  }
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret, path }),
  });
  logger.info("revalidate", {
    path,
    status: res.status,
    body: await res.text(),
  });
}

export async function revalidateMany(paths: string[]) {
  for (const p of paths) {
    try {
      await revalidate(p);
    } catch (e) {
      logger.warn("revalidateMany error", {
        path: p,
        err: (e as Error).message,
      });
    }
  }
}

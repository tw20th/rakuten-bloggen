// functions/src/utils/revalidate.ts
import { logger } from "firebase-functions";

const vercelUrl = process.env.VERCEL_URL ?? "";
const secret = process.env.REVALIDATE_SECRET ?? "";

function assertEnv(): void {
  if (!vercelUrl) throw new Error("VERCEL_URL is not set");
  if (!secret) throw new Error("REVALIDATE_SECRET is not set");
}

export async function revalidatePath(path: string): Promise<void> {
  assertEnv();
  const url = `${vercelUrl}/api/revalidate`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, path }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Revalidate failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as { ok?: boolean; path?: string };
  logger.info("Revalidated", json);
}

export async function revalidateMany(paths: string[]): Promise<void> {
  for (const p of paths) {
    try {
      await revalidatePath(p);
    } catch (e) {
      logger.warn(`Revalidate error at ${p}: ${(e as Error).message}`);
      // 続行（他のパスは止めない）
    }
  }
}

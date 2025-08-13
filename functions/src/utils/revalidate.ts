export async function callRevalidate(path: string): Promise<void> {
  const endpoint = process.env.REVALIDATE_ENDPOINT;
  const secret = process.env.REVALIDATE_SECRET;
  if (!endpoint || !secret) {
    console.warn("Revalidate not configured");
    return;
  }
  await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret, path }),
  }).catch((e) => console.error("revalidate error", e));
}

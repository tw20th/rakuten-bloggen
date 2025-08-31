import { db } from "./firebase";

export async function isGenerationEnabled(): Promise<boolean> {
  try {
    const snap = await db.collection("system").doc("flags").get();
    const enabled = snap.exists ? !!snap.get("generationEnabled") : true;
    return enabled;
  } catch {
    return true; // 取れない時はON扱い
  }
}

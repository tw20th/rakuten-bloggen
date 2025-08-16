// functions/src/lib/openai.ts 差し替え推奨
import { OpenAI } from "openai";

export const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing");
  return new OpenAI({ apiKey });
};

const SYS =
  "あなたは製品要約のプロです。日本語で、購買を後押しする要約を1〜2文、合計120字以内で出力してください。専門用語は平易に。記号は最小限。";

export async function generateSummaryFromFeatures(
  featureText: string,
): Promise<string> {
  const openai = getOpenAIClient();
  const content = (featureText ?? "").trim();
  if (!content) return "";

  // リトライ最大2回
  let lastErr: unknown;
  for (let i = 0; i < 2; i++) {
    try {
      const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYS },
          { role: "user", content },
        ],
        temperature: 0.5,
        max_tokens: 120,
      });
      const out = resp.choices[0]?.message?.content?.trim() ?? "";
      return out.slice(0, 160); // 念のためクリップ
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastErr ?? new Error("OpenAI request failed");
}

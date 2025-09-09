// functions/src/lib/openai.ts
import OpenAI from "openai";
import { OPENAI_API_KEY } from "../config/secrets";

// ---- Client ----
export const getOpenAIClient = () => {
  const apiKey = OPENAI_API_KEY.value() || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing");
  return new OpenAI({ apiKey });
};

// ---- Utils ----
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function stripCodeFence(s: string) {
  // ```json ... ``` や ``` ... ``` を除去
  const m = s.trim().match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return m ? m[1].trim() : s.trim();
}

function safeJSONParse<T = any>(s: string): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    // よくある過剰カンマや末尾コンマは軽く矯正（雑だが実用的）
    const fixed = s
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/\u0000/g, "");
    return JSON.parse(fixed) as T;
  }
}

type RetryOpts = {
  retries: number; // 試行回数（失敗後の再試行回数ではなく総回数-1）
  baseDelayMs: number; // 初期待機
  factor: number; // 乗数
  maxDelayMs: number; // 最大待機
};

async function withRetry<T>(
  fn: () => Promise<T>,
  { retries, baseDelayMs, factor, maxDelayMs }: RetryOpts,
): Promise<T> {
  let lastErr: any;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      lastErr = e;
      const status = e?.status ?? e?.error?.status;
      const code = e?.code ?? e?.error?.code;
      const retryable =
        status === 429 || (typeof status === "number" && status >= 500);
      if (!retryable || i === retries) break;
      const delay =
        Math.min(maxDelayMs, baseDelayMs * Math.pow(factor, i)) *
        (0.85 + Math.random() * 0.3); // ジッター
      await sleep(delay);
    }
  }
  throw lastErr ?? new Error("OpenAI request failed");
}

// ======================================================
//  テキスト（軽量）
// ======================================================
export async function chatText(
  system: string,
  user: string,
  opts?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    retries?: number;
  },
): Promise<string> {
  const openai = getOpenAIClient();
  const model = opts?.model ?? "gpt-4o-mini";
  const temperature = opts?.temperature ?? 0.5;
  const max_tokens = clamp(opts?.maxTokens ?? 800, 1, 2000); // 安全上限
  const retries = clamp(opts?.retries ?? 2, 0, 5);

  const result = await withRetry(
    async () => {
      const resp = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature,
        max_tokens,
      });
      return resp.choices[0]?.message?.content?.trim() ?? "";
    },
    { retries, baseDelayMs: 800, factor: 2, maxDelayMs: 8000 },
  );
  return result;
}

// ======================================================
//  JSON 返却（response_format=json_object）
// ======================================================
export async function chatJson<T = any>(
  system: string,
  user: string,
  opts?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    retries?: number;
  },
): Promise<T> {
  const openai = getOpenAIClient();
  const model = opts?.model ?? "gpt-4o-mini";
  const temperature = opts?.temperature ?? 0.3;
  const max_tokens = clamp(opts?.maxTokens ?? 500, 1, 3000);
  const retries = clamp(opts?.retries ?? 2, 0, 5);

  const runOnce = async () => {
    const resp = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature,
      max_tokens,
      response_format: { type: "json_object" },
    });
    const raw = resp.choices[0]?.message?.content ?? "{}";
    return safeJSONParse<T>(stripCodeFence(raw) || "{}");
  };

  return withRetry(runOnce, {
    retries,
    baseDelayMs: 800,
    factor: 2,
    maxDelayMs: 8000,
  });
}

// ======================================================
//  1～2文の要約
// ======================================================
const SUM_SYS =
  "あなたは製品要約のプロです。日本語で、購買を後押しする要約を1〜2文、合計120字以内で出力してください。専門用語は平易に。記号は最小限。";

export async function generateSummaryFromFeatures(
  featureText: string,
): Promise<string> {
  const content = (featureText ?? "").trim();
  if (!content) return "";

  // 上の chatText を利用（実装重複を排除）
  const out = await chatText(SUM_SYS, content, {
    model: "gpt-4o-mini",
    temperature: 0.5,
    maxTokens: 120,
    retries: 2,
  });
  return out.slice(0, 160);
}

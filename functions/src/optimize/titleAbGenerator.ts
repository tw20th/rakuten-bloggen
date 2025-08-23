import * as logger from "firebase-functions/logger";
import OpenAI from "openai";
import { db } from "../lib/firebase";
import { OPENAI_API_KEY } from "../config/secrets";

function getClient() {
  const key = OPENAI_API_KEY.value();
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey: key });
}

/** 公開済みの最新M件に AB タイトル候補を付与（既にある場合はスキップ） */
export async function titleAbGenerator(maxDocs = 30) {
  const client = getClient();
  const snap = await db
    .collection("blogs")
    .where("status", "==", "published")
    .orderBy("updatedAt", "desc")
    .limit(maxDocs)
    .get();

  if (snap.empty) return 0;

  let updated = 0;
  for (const d of snap.docs) {
    const b = d.data() as any;
    const ab = b.ab || {};
    if (Array.isArray(ab.titleCandidates) && ab.titleCandidates.length >= 2)
      continue; // 既に十分ある

    const prompt = [
      "以下の日本語記事タイトルを、検索・Discover向けにCTRが上がる形で2〜3案、40〜55文字目安で生成してください。",
      "・感情＋具体メリット（数字/比較/ベネフィット）を含める",
      "・記号の多用は避ける／ブランド名は先頭寄り／冗長な型番は簡潔に",
      "・出力は各案を1行ずつ",
      "",
      `元タイトル: ${b.title}`,
      `記事冒頭: ${(b.content || "").slice(0, 200)}`,
    ].join("\n");

    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const text = res.choices[0]?.message?.content || "";
    const lines = text
      .split(/\r?\n/)
      .map((s) => s.replace(/^\s*[-*・\d.]+\s*/, "").trim())
      .filter(Boolean);
    const uniq = Array.from(new Set(lines)).slice(0, 3);

    if (uniq.length >= 2) {
      await d.ref.update({
        ab: { ...(ab || {}), titleCandidates: uniq, currentIndex: 0 },
        updatedAt: new Date(),
      });
      updated++;
    }
  }
  logger.info("titleAbGenerator finished", { updated });
  return updated;
}

// functions/src/utils/generateAiSummary.ts
import OpenAI from "openai";
import { OPENAI_API_KEY } from "../config/secrets";

const getOpenAIClient = () => {
  const apiKey = OPENAI_API_KEY.value();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey });
};

export const generateAiSummary = async (
  itemName: string,
  description: string,
): Promise<string> => {
  const openai = getOpenAIClient();

  const prompt = `以下の商品について、要点を100文字以内でわかりやすくまとめてください。

商品名: ${itemName}
説明: ${description}`;

  const res = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });

  return res.choices[0].message.content?.trim() || "";
};

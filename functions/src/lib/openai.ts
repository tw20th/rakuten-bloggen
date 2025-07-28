// functions/src/lib/openai.ts
import { OpenAI } from "openai";

export const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing");
  return new OpenAI({ apiKey });
};

export const generateSummaryFromFeatures = async (
  featureText: string,
): Promise<string> => {
  const openai = getOpenAIClient();

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "あなたは製品要約のプロです。端的かつ魅力的に日本語で製品の特徴を1〜2文で要約してください。",
      },
      {
        role: "user",
        content: featureText,
      },
    ],
    temperature: 0.7,
  });

  return completion.choices[0].message.content ?? "";
};

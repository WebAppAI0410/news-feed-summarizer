import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

const summarizeStep = createStep({
  id: "summarize-article",
  description: "記事を要約し、重要なポイントを抽出する",
  inputSchema: z.object({
    title: z.string(),
    content: z.string(),
    url: z.string(),
    language: z.enum(["ja", "en"]),
  }),
  outputSchema: z.object({
    summaryText: z.string(),
    keyPoints: z.array(z.string()),
    language: z.enum(["ja", "en"]),
  }),
  execute: async ({ inputData, mastra }) => {
    if (!mastra) {
      throw new Error("Mastra is not initialized");
    }

    const { title, content, url, language } = inputData;
    const agent = mastra.getAgent("summaryAgent");

    const prompt = language === "ja" 
      ? `以下の記事を400字以内で要約し、重要なポイントを3-5個箇条書きで抽出してください。

タイトル: ${title}
URL: ${url}
内容: ${content}

以下のJSON形式で回答してください：
{
  "summary": "要約文",
  "keyPoints": ["ポイント1", "ポイント2", "ポイント3"]
}`
      : `Please summarize the following article in 400 characters or less and extract 3-5 key points in bullet points.

Title: ${title}
URL: ${url}
Content: ${content}

Please respond in the following JSON format:
{
  "summary": "Summary text",
  "keyPoints": ["Point 1", "Point 2", "Point 3"]
}`;

    const result = await agent.generate([
      {
        role: "user",
        content: prompt,
      },
    ]);

    try {
      const parsedResult = JSON.parse(result.text);
      return {
        summaryText: parsedResult.summary,
        keyPoints: parsedResult.keyPoints,
        language,
      };
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      return {
        summaryText: result.text.substring(0, 400),
        keyPoints: [],
        language,
      };
    }
  },
});

export const summarizeWorkflow = createWorkflow({
  id: "summarize-workflow",
  description: "RSS記事を要約するワークフロー",
  inputSchema: z.object({
    title: z.string(),
    content: z.string(),
    url: z.string(),
    language: z.enum(["ja", "en"]),
  }),
  outputSchema: z.object({
    summaryText: z.string(),
    keyPoints: z.array(z.string()),
    language: z.enum(["ja", "en"]),
  }),
})
  .then(summarizeStep)
  .commit();
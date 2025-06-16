import { Mastra } from "@mastra/core";
import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { summarizeWorkflow } from "./workflows/summarize";

export const summaryAgent = new Agent({
  name: "summaryAgent",
  description: "RSSフィードから記事を要約するエージェント",
  instructions: `あなたは優秀なニュース要約エージェントです。
  以下のガイドラインに従って要約を作成してください：
  - 400字以内で簡潔に要約する
  - 重要なポイントを3-5個箇条書きで抽出する
  - 客観的で中立的な視点を保つ
  - 専門用語は分かりやすく説明する`,
  model: openai("gpt-4o"),
});

export const mastra = new Mastra({
  agents: {
    summaryAgent,
  },
  workflows: {
    summarizeWorkflow,
  },
});
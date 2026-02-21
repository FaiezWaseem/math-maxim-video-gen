import OpenAI from 'openai';
import { appConfig } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * Creates the Manim code generator agent
 */
export function createManimAgent() {
  const client = new OpenAI({
    apiKey: appConfig.openaiApiKey,
    baseURL: appConfig.openaiBaseURL || "https://llm.chutes.ai/v1",
  });

  const tools = [
    {
      type: 'function' as const,
      function: {
        name: 'generate_manim_code',
        description: 'Generate Manim code for a chapter',
        parameters: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Complete Manim code for the chapter',
            },
          },
          required: ['code'],
        },
      },
    },
  ];

  const systemPrompt = `You are a Manim code generator. Your job is to create Manim code for a single chapter of a video, given a detailed explanation of the chapter's content and how it should be visualized.
The code should be complete and runnable. Include all necessary imports. The code should create a single scene. Add comments to explain the code.
Do not include any comments that are not valid Python comments. Ensure the code is runnable.`;

  return {
    client,
    tools,
    systemPrompt,
  };
}

/**
 * Generates Manim code for a single chapter
 * @param chapterTitle - The title of the chapter
 * @param explanation - The detailed explanation of the chapter content
 * @returns The generated Manim code
 */
export async function generateManimCode(chapterTitle: string, explanation: string): Promise<string> {
  const { client, tools, systemPrompt } = createManimAgent();

  const response = await client.chat.completions.create({
    model: appConfig.openaiModel,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Generate Manim code for the following chapter.\n\nChapter Title: ${chapterTitle}\n\nExplanation:\n${explanation}`,
      },
    ],
    tools,
    tool_choice: { type: 'function', function: { name: 'generate_manim_code' } },
    temperature: 0.7,
  });

  const toolCall = response.choices[0].message.tool_calls?.[0];
  if (!toolCall || toolCall.type !== 'function') {
    throw new Error('Failed to get function call response from OpenAI');
  }

  const result = JSON.parse(toolCall.function.arguments);
  logger.debug(`Generated Manim code for chapter "${chapterTitle}":\n${result.code}`);

  return result.code;
}

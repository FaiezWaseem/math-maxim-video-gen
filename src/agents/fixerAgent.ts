import OpenAI from 'openai';
import { appConfig } from '../config/index.js';

/**
 * Creates the code fixer agent for debugging Manim code
 */
export function createFixerAgent() {
  const client = new OpenAI({
    apiKey: appConfig.openaiApiKey,
    baseURL: appConfig.openaiBaseURL || "https://llm.chutes.ai/v1",
  });

  const tools = [
    {
      type: 'function' as const,
      function: {
        name: 'fix_manim_code',
        description: 'Fix Manim code that resulted in an error',
        parameters: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Corrected Manim code that fixes the error',
            },
          },
          required: ['code'],
        },
      },
    },
  ];

  const systemPrompt = `You are a Manim code debugging expert. You will receive Manim code that failed to execute and the error message.
Your task is to analyze the code and the error, identify the issue, and provide corrected, runnable Manim code.
Ensure the corrected code addresses the error and still aims to achieve the visualization described in the original code.
Include all necessary imports and ensure the code creates a single scene. Add comments to explain the changes you made.
Do not include any comments that are not valid Python comments. Ensure the code is runnable.`;

  return {
    client,
    tools,
    systemPrompt,
  };
}

/**
 * Attempts to fix Manim code that resulted in an error
 * @param error - The error message from failed execution
 * @param currentCode - The current Manim code that failed
 * @returns The corrected Manim code
 */
export async function fixManimCode(error: string, currentCode: string): Promise<string> {
  const { client, tools, systemPrompt } = createFixerAgent();

  const response = await client.chat.completions.create({
    model: appConfig.openaiModel,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Please fix the following Manim code that resulted in an error.\n\nError:\n${error}\n\nCurrent Code:\n${currentCode}`,
      },
    ],
    tools,
    tool_choice: { type: 'function', function: { name: 'fix_manim_code' } },
    temperature: 0.7,
  });

  const toolCall = response.choices[0].message.tool_calls?.[0];
  if (!toolCall || toolCall.type !== 'function') {
    throw new Error('Failed to get function call response from OpenAI');
  }

  const result = JSON.parse(toolCall.function.arguments);
  return result.code;
}

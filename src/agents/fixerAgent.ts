import { ChatOpenAI } from '@langchain/openai';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { appConfig } from '../config/index.js';
import { ManimCode } from '../types/index.js';

/**
 * Creates the code fixer agent for debugging Manim code
 */
export function createFixerAgent() {
  const model = new ChatOpenAI({
    modelName: appConfig.openaiModel,
    openAIApiKey: appConfig.openaiApiKey,
    temperature: 0.7,
    configuration: {
      baseURL: appConfig.openaiBaseURL || "https://llm.chutes.ai/v1",
    },

  });

  const parser = StructuredOutputParser.fromZodSchema(
    z.object({
      code: z.string().describe('Corrected Manim code that fixes the error'),
    })
  );

  const formatInstructions = parser.getFormatInstructions();

  const systemPrompt = `
    You are a Manim code debugging expert. You will receive Manim code that failed to execute and the error message.
    Your task is to analyze the code and the error, identify the issue, and provide corrected, runnable Manim code.
    Ensure the corrected code addresses the error and still aims to achieve the visualization described in the original code.
    Include all necessary imports and ensure the code creates a single scene. Add comments to explain the changes you made.
    Do not include any comments that are not valid Python comments. Ensure the code is runnable. Do not include any text outside of the code block.
    
    {format_instructions}
  `;

  return {
    model,
    parser,
    systemPrompt,
    formatInstructions,
  };
}

/**
 * Attempts to fix Manim code that resulted in an error
 * @param error - The error message from failed execution
 * @param currentCode - The current Manim code that failed
 * @returns The corrected Manim code
 */
export async function fixManimCode(error: string, currentCode: string): Promise<string> {
  const { model, parser, systemPrompt, formatInstructions } = createFixerAgent();

  const prompt = PromptTemplate.fromTemplate(systemPrompt);
  const chain = prompt.pipe(model).pipe(parser);

  const result = await chain.invoke({
    error,
    currentCode,
    format_instructions: formatInstructions,
  });

  return result.code;
}

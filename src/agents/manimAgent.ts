import { ChatOpenAI } from '@langchain/openai';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { appConfig } from '../config/index.js';
import { ManimCode } from '../types/index.js';

/**
 * Creates the Manim code generator agent
 */
export function createManimAgent() {
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
      code: z.string().describe('Complete Manim code for the chapter'),
    })
  );

  const formatInstructions = parser.getFormatInstructions();

  const systemPrompt = `
    You are a Manim code generator. Your job is to create Manim code for a single chapter of a video, given a detailed explanation of the chapter's content and how it should be visualized.
    The code should be complete and runnable. Include all necessary imports. The code should create a single scene. Add comments to explain the code.
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
 * Generates Manim code for a single chapter
 * @param chapterTitle - The title of the chapter
 * @param explanation - The detailed explanation of the chapter content
 * @returns The generated Manim code
 */
export async function generateManimCode(chapterTitle: string, explanation: string): Promise<string> {
  const { model, parser, systemPrompt, formatInstructions } = createManimAgent();

  const prompt = PromptTemplate.fromTemplate(systemPrompt);
  const chain = prompt.pipe(model).pipe(parser);

  const result = await chain.invoke({
    chapterTitle,
    explanation,
    format_instructions: formatInstructions,
  });

  return result.code;
}

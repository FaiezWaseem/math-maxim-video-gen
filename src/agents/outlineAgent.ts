import { ChatOpenAI } from '@langchain/openai';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { appConfig } from '../config/index.js';
import { VideoOutline } from '../types/index.js';

/**
 * Creates the outline agent for generating video outlines
 */
export function createOutlineAgent() {
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
      title: z.string().describe('Title of the entire video'),
      chapters: z.array(
        z.object({
          title: z.string().describe('Title of the chapter'),
          explanation: z.string().describe('Detailed explanation of the chapter content'),
        })
      ),
    })
  );

  const formatInstructions = parser.getFormatInstructions();

  const systemPrompt = `
    You are a video script writer. Your job is to create a clear and concise outline for an educational video explaining a concept.
    The video should have a title and a list of chapters (maximum 3). Each chapter should have a title and a detailed explanation.
    The explanation should be very specific about how the concept should be visualized using Manim. Include detailed instructions
    for animations, shapes, positions, colors, and timing. Use LaTeX for mathematical formulas. Specify scene transitions.
    Do not include code, only explanations.
    
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
 * Generates a video outline for a given concept
 * @param concept - The concept/topic for the video
 * @returns The generated video outline
 */
export async function generateVideoOutline(concept: string): Promise<VideoOutline> {
  const { model, parser, systemPrompt, formatInstructions } = createOutlineAgent();

  const prompt = PromptTemplate.fromTemplate(systemPrompt);
  const chain = prompt.pipe(model).pipe(parser);

  const result = await chain.invoke({
    concept,
    format_instructions: formatInstructions,
  });

  return result as VideoOutline;
}

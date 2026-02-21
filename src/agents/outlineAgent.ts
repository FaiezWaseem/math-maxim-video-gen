import OpenAI from 'openai';
import { appConfig } from '../config/index.js';
import { VideoOutline } from '../types/index.js';

/**
 * Creates the outline agent for generating video outlines
 */
export function createOutlineAgent() {
  const client = new OpenAI({
    apiKey: appConfig.openaiApiKey,
    baseURL: appConfig.openaiBaseURL || "https://llm.chutes.ai/v1",
  });

  const tools = [
    {
      type: 'function' as const,
      function: {
        name: 'generate_video_outline',
        description: 'Generate a video outline with title and chapters',
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Title of the entire video',
            },
            chapters: {
              type: 'array',
              description: 'List of chapters for the video',
              items: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                    description: 'Title of the chapter',
                  },
                  explanation: {
                    type: 'string',
                    description: 'Detailed explanation of the chapter content',
                  },
                },
                required: ['title', 'explanation'],
              },
            },
          },
          required: ['title', 'chapters'],
        },
      },
    },
  ];

  const systemPrompt = `You are a video script writer. Your job is to create a clear and concise outline for an educational video explaining a concept.
The video should have a title and a list of chapters (maximum 3). Each chapter should have a title and a detailed explanation.
The explanation should be very specific about how the concept should be visualized using Manim. Include detailed instructions
for animations, shapes, positions, colors, and timing. Use LaTeX for mathematical formulas. Specify scene transitions.
Do not include code, only explanations.`;

  return {
    client,
    tools,
    systemPrompt,
  };
}

/**
 * Generates a video outline for a given concept
 * @param concept - The concept/topic for the video
 * @returns The generated video outline
 */
export async function generateVideoOutline(concept: string): Promise<VideoOutline> {
  const { client, tools, systemPrompt } = createOutlineAgent();

  const response = await client.chat.completions.create({
    model: appConfig.openaiModel,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Generate a video outline for the following concept: ${concept}`,
      },
    ],
    tools,
    tool_choice: { type: 'function', function: { name: 'generate_video_outline' } },
    temperature: 0.7,
  });

  const toolCall = response.choices[0].message.tool_calls?.[0];
  if (!toolCall || toolCall.type !== 'function') {
    throw new Error('Failed to get function call response from OpenAI');
  }

  const result = JSON.parse(toolCall.function.arguments) as VideoOutline;
  return result;
}

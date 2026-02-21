import { config } from 'dotenv';

// Load environment variables from .env file
config({ path: '.env' });

/**
 * Configuration interface for the application
 */
export interface AppConfig {
  openaiApiKey: string;
  openaiModel: string;
  openaiBaseURL : string;
  outputDir: string;
  maxRetries: number;
  manimTimeout: number;
}

/**
 * Application configuration
 */
export const appConfig: AppConfig = {
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiBaseURL : process.env.OPENAI_BASE_URL || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  outputDir: process.env.OUTPUT_DIR || './output',
  maxRetries: parseInt(process.env.MAX_RETRIES || '2', 10),
  manimTimeout: parseInt(process.env.MANIM_TIMEOUT || '60', 10),
};

/**
 * Validate required configuration
 * @throws Error if required configuration is missing
 */
export function validateConfig(): void {
  if (!appConfig.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is required. Please create a .env file with your OpenAI API key.');
  }
    if (!appConfig.openaiBaseURL) {
    throw new Error('OPENAI_BASE_URL is required. Please create a .env file with your OpenAI API base URL.');
  }
  console.debug('Configuration validated successfully');
}

// Validate configuration on import
validateConfig();

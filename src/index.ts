#!/usr/bin/env bun

import { Command } from 'commander';
import { generateVideo } from './video/generate.js';
import { appConfig, validateConfig } from './config/index.js';
import { logger } from './utils/logger.js';

const program = new Command();

program
  .name('explanatory-video-generator')
  .description('AI-powered explanatory video generator using OpenAI and FFmpeg')
  .version('1.0.0');

program
  .option('-c, --concept <concept>', 'The concept/topic for the video (required)')
  .option('-o, --output <file>', 'Output video file path', 'output.mp4')
  .option('-n, --chapters <number>', 'Number of chapters (max 3)', '3')
  .option('-r, --retries <number>', 'Maximum number of retries for failed chapters', '2')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (options) => {
    try {
      // Validate configuration
      validateConfig();

      // Set verbose mode
      if (options.verbose) {
        process.env.VERBOSE = 'true';
      }

      // Validate required options
      if (!options.concept) {
        logger.error('Concept is required. Use --concept <concept>');
        program.help();
        process.exit(1);
      }

      // Parse chapter count
      const chapters = parseInt(options.chapters, 10);
      if (isNaN(chapters) || chapters < 1 || chapters > 3) {
        logger.error('Chapters must be a number between 1 and 3');
        process.exit(1);
      }

      // Parse retries
      const retries = parseInt(options.retries, 10);
      if (isNaN(retries) || retries < 0) {
        logger.error('Retries must be a non-negative number');
        process.exit(1);
      }

      logger.info('Starting video generation...');
      logger.info(`Concept: ${options.concept}`);
      logger.info(`Output: ${options.output}`);
      logger.info(`Chapters: ${chapters}`);
      logger.info(`Max Retries: ${retries}`);

      // Generate the video
      const result = await generateVideo({
        concept: options.concept,
        output: options.output,
        chapters,
        maxRetries: retries,
      });

      if (result.success) {
        logger.success(`Video generated successfully: ${result.outputPath}`);
        process.exit(0);
      } else {
        logger.error(`Video generation failed: ${result.error}`);
        process.exit(1);
      }
    } catch (error: any) {
      logger.error(`Unexpected error: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();

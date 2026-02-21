import { appConfig } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { ensureOutputDir } from '../utils/helpers.js';
import { generateVideoOutline } from '../agents/outlineAgent.js';
import { generateManimCode } from '../agents/manimAgent.js';
import { fixManimCode } from '../agents/fixerAgent.js';
import { compileManimVideo, combineVideos } from '../video/compile.js';
import { ChapterResult, VideoGenerationResult } from '../types/index.js';

/**
 * Generates a video for a single chapter with error correction
 * @param chapter - The chapter description
 * @param chapterIndex - The chapter index
 * @returns The chapter result
 */
async function generateChapterVideo(
  chapter: { title: string; explanation: string },
  chapterIndex: number
): Promise<ChapterResult> {
  const maxRetries = appConfig.maxRetries;
  let attempts = 0;
  let currentCode = '';
  let videoFile: string | null = null;

  logger.info(`Processing chapter ${chapterIndex + 1}: ${chapter.title}`);
  logger.debug(`Chapter explanation: ${chapter.explanation}`);

  while (attempts <= maxRetries && !videoFile) {
    try {
      if (attempts > 0) {
        logger.info(`Attempting to fix Manim code (attempt ${attempts + 1})...`);
        currentCode = await fixManimCode(`Previous error: ${currentCode}`, currentCode);
      } else {
        currentCode = await generateManimCode(chapter.title, chapter.explanation);
      }

      logger.debug(`Generated Manim code for chapter ${chapterIndex + 1}:\n${currentCode}`);

      const videoPath = await compileManimVideo(currentCode, chapterIndex + 1);
      videoFile = videoPath;
      logger.success(`Video file created for chapter ${chapterIndex + 1}: ${videoPath}`);

      return {
        chapterIndex,
        chapterTitle: chapter.title,
        videoFile,
        success: true,
      };
    } catch (error: any) {
      attempts++;
      logger.error(`Manim execution failed for chapter ${chapterIndex + 1} (attempt ${attempts}): ${error.message}`);

      if (attempts > maxRetries) {
        logger.error(`Failed to generate video for chapter ${chapterIndex + 1} after ${maxRetries} attempts`);
        return {
          chapterIndex,
          chapterTitle: chapter.title,
          videoFile: null,
          success: false,
          error: error.message,
        };
      }
    }
  }

  return {
    chapterIndex,
    chapterTitle: chapter.title,
    videoFile: null,
    success: false,
    error: 'Unknown error',
  };
}

/**
 * Generates a complete video for a given concept
 * @param options - The video generation options
 * @returns The video generation result
 */
export async function generateVideo(options: {
  concept: string;
  output?: string;
  chapters?: number;
  maxRetries?: number;
}): Promise<VideoGenerationResult> {
  const { concept, output = 'output.mp4', chapters = 3, maxRetries = 2 } = options;

  // Update config with options
  appConfig.maxRetries = maxRetries;

  logger.info(`Generating video for concept: ${concept}`);

  // Ensure output directory exists
  await ensureOutputDir();

  // Generate video outline
  const outline = await generateVideoOutline(concept);
  logger.info(`Video outline generated: ${outline.title}`);
  logger.debug(`Chapters: ${outline.chapters.length}`);

  // Limit chapters to requested number
  const chapterLimit = Math.min(chapters, outline.chapters.length);
  const selectedChapters = outline.chapters.slice(0, chapterLimit);

  // Generate videos for each chapter
  const chapterResults: ChapterResult[] = [];
  const videoFiles: string[] = [];

  for (let i = 0; i < selectedChapters.length; i++) {
    const result = await generateChapterVideo(selectedChapters[i], i);
    chapterResults.push(result);

    if (result.success && result.videoFile) {
      videoFiles.push(result.videoFile);
    }
  }

  // Combine videos if all chapters were successful
  let finalVideoPath: string | null = null;
  if (videoFiles.length > 0) {
    finalVideoPath = output.startsWith('/') ? output : `${appConfig.outputDir}/${output}`;
    try {
      await combineVideos(videoFiles, finalVideoPath);
      logger.success('Video generation complete!');
    } catch (error: any) {
      logger.error(`Error combining videos: ${error.message}`);
      return {
        success: false,
        outputPath: null,
        chapters: chapterResults,
        error: error.message,
      };
    }
  } else {
    logger.warn('No video files were generated');
    return {
      success: false,
      outputPath: null,
      chapters: chapterResults,
      error: 'No successful chapters generated',
    };
  }

  // Clean up intermediate video files
  for (const videoFile of videoFiles) {
    try {
      const fs = await import('fs/promises');
      await fs.unlink(videoFile);
      logger.debug(`Deleted intermediate video file: ${videoFile}`);
    } catch (error) {
      logger.warn(`Error deleting intermediate video file ${videoFile}: ${error}`);
    }
  }

  return {
    success: true,
    outputPath: finalVideoPath,
    chapters: chapterResults,
  };
}

import { appConfig } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * Creates the output directory if it doesn't exist
 */
export async function ensureOutputDir(): Promise<string> {
  const fs = await import('fs/promises');
  await fs.mkdir(appConfig.outputDir, { recursive: true });
  return appConfig.outputDir;
}

/**
 * Extracts the class name from Manim code
 * @param code - The Manim code string
 * @returns The class name or null if not found
 */
export function extractClassName(code: string): string | null {
  const match = code.match(/class\s+(\w+)\(Scene\):/);
  return match ? match[1] : null;
}

/**
 * Gets the video file path for a chapter
 * @param className - The Manim scene class name
 * @param chapterNumber - The chapter number
 * @returns The video file path
 */
export function getVideoFilePath(className: string, chapterNumber: number): string {
  const videoFileName = `${className}.mp4`;
  return `./media/videos/temp/480p15/${videoFileName}`;
}

/**
 * Cleans up temporary files
 * @param files - Array of file paths to delete
 */
export async function cleanupFiles(files: string[]): Promise<void> {
  const fs = await import('fs/promises');
  
  for (const file of files) {
    try {
      await fs.unlink(file);
      logger.debug(`Deleted file: ${file}`);
    } catch (error) {
      logger.warn(`Could not delete file: ${file}`, error);
    }
  }
}

/**
 * Waits for a specified duration
 * @param ms - Duration in milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

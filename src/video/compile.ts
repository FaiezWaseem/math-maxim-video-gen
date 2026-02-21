import { exec } from 'child_process';
import { promisify } from 'util';
import { appConfig } from '../config/index.js';
import { logger } from '../utils/logger.js';

const execAsync = promisify(exec);

/**
 * Executes Manim to generate a video from code
 * @param code - The Manim code
 * @param chapterNumber - The chapter number
 * @returns The path to the generated video file
 */
export async function compileManimVideo(code: string, chapterNumber: number): Promise<string> {
  const fs = await import('fs/promises');
  
  // Write the Manim code to a temporary file
  const tempFilePath = './temp.py';
  await fs.writeFile(tempFilePath, code);
  
  logger.info(`Compiling Manim video for chapter ${chapterNumber}...`);
  
  try {
    const command = `manim ${tempFilePath} -ql --disable_caching`;
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: appConfig.manimTimeout * 1000,
    });
    
    if (stdout) {
      logger.debug(`Manim stdout:\n${stdout}`);
    }
    
    if (stderr) {
      logger.debug(`Manim stderr:\n${stderr}`);
    }
    
    logger.success(`Manim execution successful for chapter ${chapterNumber}`);
    
    // Extract class name from code to get video file name
    const match = code.match(/class\s+(\w+)\(Scene\):/);
    if (!match) {
      throw new Error('Could not extract class name from Manim code');
    }
    
    const className = match[1];
    const videoFileName = `${className}.mp4`;
    const videoPath = `./media/videos/temp/480p15/${videoFileName}`;
    
    // Check if video file exists
    try {
      await fs.access(videoPath);
    } catch {
      throw new Error(`Video file not found at expected path: ${videoPath}`);
    }
    
    return videoPath;
    
  } catch (error: any) {
    if (error.code === 'ETIMEDOUT') {
      throw new Error(`Manim execution timed out for chapter ${chapterNumber}`);
    }
    throw new Error(`Manim execution failed for chapter ${chapterNumber}: ${error.message}`);
  } finally {
    // Clean up temp file
    try {
      await fs.unlink(tempFilePath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Combines multiple video files into a single final video
 * @param videoFiles - Array of video file paths to combine
 * @param outputPath - The output file path
 * @returns The path to the final combined video
 */
export async function combineVideos(videoFiles: string[], outputPath: string): Promise<string> {
  const fs = await import('fs/promises');
  
  logger.info('Combining video files...');
  
  if (videoFiles.length === 0) {
    throw new Error('No video files to combine');
  }
  
  // Verify all files exist
  for (const file of videoFiles) {
    try {
      await fs.access(file);
    } catch {
      throw new Error(`Video file not found: ${file}`);
    }
  }
  
  // Create FFmpeg input file list
  const inputList = videoFiles.map(file => `file '${file}'`).join('\n');
  const listFilePath = './video_list.txt';
  await fs.writeFile(listFilePath, inputList);
  
  try {
    // Use FFmpeg to concatenate videos
    const command = `ffmpeg -f concat -safe 0 -i ${listFilePath} -c copy ${outputPath}`;
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stdout) {
      logger.debug(`FFmpeg stdout:\n${stdout}`);
    }
    
    if (stderr) {
      logger.debug(`FFmpeg stderr:\n${stderr}`);
    }
    
    logger.success(`Final video created: ${outputPath}`);
    return outputPath;
    
  } finally {
    // Clean up input list file
    try {
      await fs.unlink(listFilePath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

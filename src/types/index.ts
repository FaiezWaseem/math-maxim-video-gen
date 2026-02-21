/**
 * Chapter description for a video section
 */
export interface ChapterDescription {
  title: string;
  explanation: string;
}

/**
 * Video outline containing title and chapters
 */
export interface VideoOutline {
  title: string;
  chapters: ChapterDescription[];
}

/**
 * Manim code for a single chapter
 */
export interface ManimCode {
  code: string;
}

/**
 * Video generation options
 */
export interface VideoGenerationOptions {
  concept: string;
  output?: string;
  chapters?: number;
  maxRetries?: number;
}

/**
 * Chapter generation result
 */
export interface ChapterResult {
  chapterIndex: number;
  chapterTitle: string;
  videoFile: string | null;
  success: boolean;
  error?: string;
}

/**
 * Final video generation result
 */
export interface VideoGenerationResult {
  success: boolean;
  outputPath: string | null;
  chapters: ChapterResult[];
  error?: string;
}

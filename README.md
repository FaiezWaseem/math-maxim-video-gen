# Explanatory Video Generator AI

AI-powered explanatory video generator using OpenAI and FFmpeg. This project converts a concept into a complete educational video with animated explanations.

## Features

- **AI-Powered Video Generation**: Uses OpenAI's GPT models to generate video outlines and Manim-style code
- **Video Composition**: Combines generated video clips using FFmpeg
- **Error Correction**: Automatically fixes and retries failed video generation attempts
- **CLI Interface**: Simple command-line interface for easy integration

## Prerequisites

- **Bun** (v1.0 or higher) - [Install Bun](https://bun.sh/)
- **FFmpeg** - [Install FFmpeg](https://ffmpeg.org/download.html)
- **OpenAI API Key** - Get one from [OpenAI Platform](https://platform.openai.com/)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd explanatory-video-generator

# Install dependencies
bun install

# Create a .env file with your OpenAI API key
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

## Usage

### Basic Usage

```bash
# Generate a video for a concept
bun run src/index.ts --concept "How does photosynthesis work?"

# Generate a video with custom output path
bun run src/index.ts --concept "Quantum computing basics" --output ./my-video.mp4

# Generate a video with specific number of chapters
bun run src/index.ts --concept "The solar system" --chapters 3
```

### Command Line Options

```
Usage: index.ts [options]

AI-powered explanatory video generator

Options:
  -c, --concept <concept>     The concept/topic for the video (required)
  -o, --output <file>         Output video file path (default: "output.mp4")
  -n, --chapters <number>     Number of chapters (max 3, default: 3)
  -v, --verbose               Enable verbose logging
  -h, --help                  Display help for command
```

## Project Structure

```
src/
├── index.ts                  # Main entry point with CLI
├── config/                   # Configuration files
│   └── index.ts              # Environment and settings
├── agents/                   # AI agent definitions
│   ├── outlineAgent.ts       # Video outline generator
│   ├── manimAgent.ts         # Manim code generator
│   └── fixerAgent.ts         # Code error fixer
├── video/                    # Video generation logic
│   ├── generate.ts           # Main video generation
│   ├── compile.ts            # FFmpeg compilation
│   └── utils.ts              # Helper functions
├── types/                    # TypeScript type definitions
│   └── index.ts              # Shared types
└── utils/                    # Utility functions
    └── logger.ts             # Logging utilities
```

## Architecture

### AI Agents

1. **Outline Agent**: Generates a video outline with title and chapters
2. **Manim Agent**: Creates Manim code for each chapter
3. **Fixer Agent**: Corrects and retries failed Manim code

### Video Generation Pipeline

1. Parse input concept
2. Generate video outline (title + chapters)
3. For each chapter:
   - Generate Manim code
   - Execute Manim to create video clip
   - Fix errors if needed (up to 2 retries)
4. Combine all video clips using FFmpeg
5. Output final video

## Environment Variables

Create a `.env` file in the root directory:

```
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

## Configuration

The project uses the following default settings:

- **Model**: gpt-4o-mini (can be changed via environment variable)
- **Max Chapters**: 3
- **Max Retries**: 2 per chapter
- **Output Format**: MP4 with H.264 codec

## Error Handling

The project includes robust error handling:

- **Manim Execution Failures**: Automatically retries with corrected code
- **Timeout Protection**: 60-second timeout for Manim execution
- **Graceful Degradation**: Continues processing other chapters if one fails

## License

MIT License - See [LICENSE](LICENSE) for details.

## Acknowledgments

This project is a Node.js/Bun.js conversion of the original Python project [Explanatory_Video_Generator_AI](https://github.com/mharrish7/Explanatory_Video_Generator_AI).

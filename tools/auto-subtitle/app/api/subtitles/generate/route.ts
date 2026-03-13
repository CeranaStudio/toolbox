import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { v4 as uuidv4 } from "uuid";
import { transcribeAudio } from '@/app/lib/transcription';

const createDirectories = async (uploadDir: string, outputDir: string) => {
  if (!fs.existsSync(uploadDir)) {
    await fs.promises.mkdir(uploadDir, { recursive: true });
  }
  if (!fs.existsSync(outputDir)) {
    await fs.promises.mkdir(outputDir, { recursive: true });
  }
};

const saveFileToDisk = async (file: File, uploadDir: string, filename: string): Promise<string> => {
  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(uploadDir, filename);
  await fs.promises.writeFile(filePath, buffer);
  return filePath;
};

export const POST = async (request: NextRequest) => {
  const requestId = uuidv4().slice(0, 8);
  console.log(`[${requestId}] Starting subtitle generation request`);
  
  try {
    const formData = await request.formData();
    const mode = formData.get('mode') as string ?? 'audio';
    console.log(`[${requestId}] Mode: ${mode}`);
    
    const uploadDir = path.join(process.cwd(), 'uploads', requestId);
    const outputDir = path.join(process.cwd(), 'public', 'uploads', requestId);
    
    console.log(`[${requestId}] Creating directories`);
    await createDirectories(uploadDir, outputDir);
    
    let audioPath = '';
    let subtitlesPath = '';
    
    if (mode === 'audio') {
      console.log(`[${requestId}] Processing audio mode for subtitles`);
      const audioFile = formData.get('audio') as File;
      
      if (!audioFile) {
        console.error(`[${requestId}] No audio file provided`);
        return NextResponse.json(
          { error: 'Audio file is required' },
          { status: 400 }
        );
      }
      
      console.log(`[${requestId}] Audio file: ${audioFile.name}, size: ${audioFile.size} bytes`);
      
      // Validate audio file size
      if (audioFile.size > 50 * 1024 * 1024) {
        console.error(`[${requestId}] Audio file too large: ${audioFile.size} bytes`);
        return NextResponse.json(
          { error: 'Audio file is too large. Maximum size is 50MB.' },
          { status: 400 }
        );
      }
      
      // Save audio file
      console.log(`[${requestId}] Saving audio file`);
      const audioExt = path.extname(audioFile.name) ?? '.mp3';
      audioPath = await saveFileToDisk(
        audioFile,
        uploadDir,
        `audio${audioExt}`
      );
      console.log(`[${requestId}] Audio saved to: ${audioPath}`);
      
    } else if (mode === 'video') {
      console.log(`[${requestId}] Processing video mode for subtitles`);
      const videoFile = formData.get('video') as File;
      
      if (!videoFile) {
        console.error(`[${requestId}] No video file provided`);
        return NextResponse.json(
          { error: 'Video file is required' },
          { status: 400 }
        );
      }
      
      console.log(`[${requestId}] Video file: ${videoFile.name}, size: ${videoFile.size} bytes`);
      
      // Validate video file size
      if (videoFile.size > 100 * 1024 * 1024) {
        console.error(`[${requestId}] Video file too large: ${videoFile.size} bytes`);
        return NextResponse.json(
          { error: 'Video file is too large. Maximum size is 100MB.' },
          { status: 400 }
        );
      }
      
      // Save video file
      console.log(`[${requestId}] Saving video file`);
      const videoExt = path.extname(videoFile.name) ?? '.mp4';
      const videoPath = await saveFileToDisk(
        videoFile,
        uploadDir,
        `video${videoExt}`
      );
      console.log(`[${requestId}] Video saved to: ${videoPath}`);
      
      // Extract audio from video
      console.log(`[${requestId}] Extracting audio from video`);
      audioPath = path.join(uploadDir, 'extracted-audio.wav');
      
      await new Promise<void>((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
          '-i', videoPath,
          '-vn',
          '-acodec', 'pcm_s16le',
          '-ar', '44100',
          '-ac', '2',
          audioPath,
          '-y'
        ]);
        
        ffmpeg.stderr.on('data', (data: Buffer) => {
          console.log(`[${requestId}] FFmpeg stderr: ${data.toString()}`);
        });
        
        ffmpeg.on('close', (code: number) => {
          if (code === 0) {
            console.log(`[${requestId}] Audio extraction completed successfully`);
            resolve();
          } else {
            console.error(`[${requestId}] FFmpeg process exited with code ${code}`);
            reject(new Error(`Audio extraction failed with code ${code}`));
          }
        });
        
        ffmpeg.on('error', (error: Error) => {
          console.error(`[${requestId}] FFmpeg error:`, error);
          reject(new Error(`Audio extraction failed: ${error.message}`));
        });
      });
      
      console.log(`[${requestId}] Audio extracted to: ${audioPath}`);
    }
    
    // Transcribe the audio file
    console.log(`[${requestId}] Starting audio transcription`);
    const transcription = await transcribeAudio(audioPath);
    console.log(`[${requestId}] Transcription completed, length: ${transcription.length} characters`);
    
    // Save the generated subtitles
    subtitlesPath = path.join(uploadDir, 'subtitles.vtt');
    await fs.promises.writeFile(subtitlesPath, transcription);
    console.log(`[${requestId}] Subtitles saved to: ${subtitlesPath}`);
    
    // Copy subtitles to public directory for serving
    const publicSubtitlesPath = path.join(outputDir, 'subtitles.vtt');
    await fs.promises.copyFile(subtitlesPath, publicSubtitlesPath);
    console.log(`[${requestId}] Subtitles copied to public directory: ${publicSubtitlesPath}`);
    
    const subtitlesUrl = `/uploads/${requestId}/subtitles.vtt`;
    
    console.log(`[${requestId}] Subtitle generation completed successfully - subtitlesUrl: ${subtitlesUrl}`);
    
    return NextResponse.json({
      subtitlesUrl,
      requestId // Include requestId for potential video generation later
    });
    
  } catch (error: unknown) {
    console.error(`[${requestId}] Error in subtitle generation:`, error);
    
    if (error instanceof Error) {
      console.error(`[${requestId}] Known error: ${error.message}`);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.error(`[${requestId}] Unknown error type`);
    return NextResponse.json(
      { error: 'Failed to generate subtitles' },
      { status: 500 }
    );
  }
};
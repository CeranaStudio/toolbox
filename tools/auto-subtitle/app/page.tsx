"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import EnvironmentCheck from "./components/EnvironmentCheck";
import ProcessingSteps from "./components/ProcessingSteps";
import SubtitleEditor, { SubtitleEditorRef } from "./components/SubtitleEditor";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  VideoIcon, 
  ImageIcon, 
  AudioLines,
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignJustify,
  X,
  Upload,
  Download,
  ChevronDown,
  CheckCircle
} from "lucide-react";
import { downloadSubtitles as downloadSubtitleWithFormat } from "./lib/subtitle-converter";

export default function Home() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [subtitlesUrl, setSubtitlesUrl] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [dimension, setDimension] = useState<string>("720p");
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string>("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>("");
  const [subtitlePosition, setSubtitlePosition] = useState<number>(2);
  const [subtitleOutline, setSubtitleOutline] = useState<number>(3);
  const [subtitleSize, setSubtitleSize] = useState<number>(24);
  const [subtitleText, setSubtitleText] = useState<string>("預覽字幕效果");
  const [inputMode, setInputMode] = useState<string>("audio");
  const [showSubtitleFormats, setShowSubtitleFormats] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [subtitlesReady, setSubtitlesReady] = useState(false);
  const [isGeneratingSubtitles, setIsGeneratingSubtitles] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const subtitleEditorRef = useRef<SubtitleEditorRef>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [audioPreviewUrl, imagePreviewUrl, videoPreviewUrl]);

  // Add effect to handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSubtitleFormats) {
        const target = event.target as HTMLElement;
        const dropdown = target.closest('.subtitle-format-dropdown');
        if (!dropdown) {
          setShowSubtitleFormats(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSubtitleFormats]);

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAudioFile(file);
    
    if (file) {
      // Revoke old URL if exists
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
      // Create new URL
      const url = URL.createObjectURL(file);
      setAudioPreviewUrl(url);
    } else {
      setAudioPreviewUrl("");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    
    if (file) {
      // Revoke old URL if exists
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      // Create new URL
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
    } else {
      setImagePreviewUrl("");
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setVideoFile(file);
    
    if (file) {
      // Revoke old URL if exists
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      // Create new URL
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
    } else {
      setVideoPreviewUrl("");
    }
  };

  const handleModeChange = (value: string) => {
    setInputMode(value);
    // Reset state when switching modes
    if (value === "audio") {
      setVideoFile(null);
      setVideoPreviewUrl("");
    } else {
      setAudioFile(null);
      setImageFile(null);
      setAudioPreviewUrl("");
      setImagePreviewUrl("");
    }
    // Reset error and output
    setError("");
    setVideoUrl("");
    setSubtitlesUrl("");
    setSubtitlesReady(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (inputMode === "audio" && !audioFile) {
      toast.error("請上傳音訊檔案");
      setError("請上傳音訊檔案");
      return;
    }
    
    if (inputMode === "video" && !videoFile) {
      toast.error("請上傳影片檔案");
      setError("請上傳影片檔案");
      return;
    }
    
    setIsLoading(true);
    setIsGeneratingSubtitles(true);
    setError("");
    setVideoUrl("");
    setSubtitlesUrl("");
    setSubtitlesReady(false);
    setProgress(0);
    
    try {
      // Phase 1: Generate subtitles first
      console.log("Starting subtitle generation...");
      const subtitleFormData = new FormData();
      
      if (inputMode === "audio") {
        subtitleFormData.append("audio", audioFile!);
        subtitleFormData.append("mode", "audio");
      } else {
        subtitleFormData.append("video", videoFile!);
        subtitleFormData.append("mode", "video");
      }
      
      const subtitleResponse = await fetch("/api/subtitles/generate", {
        method: "POST",
        body: subtitleFormData,
      });
      
      if (!subtitleResponse.ok) {
        const errorData = await subtitleResponse.json();
        throw new Error(errorData.error || "字幕生成失敗");
      }
      
      const subtitleData = await subtitleResponse.json();
      setSubtitlesUrl(subtitleData.subtitlesUrl);
      setSubtitlesReady(true);
      setIsGeneratingSubtitles(false);
      setProgress(50);
      
      toast.success("字幕生成完成！可以立即下載或繼續生成影片。");
      
      // Phase 2: Generate video with subtitles
      console.log("Starting video generation...");
      setIsGeneratingVideo(true);
      
      const videoFormData = new FormData();
      
      if (inputMode === "audio") {
        videoFormData.append("audio", audioFile!);
        if (imageFile) videoFormData.append("image", imageFile);
        videoFormData.append("mode", "audio");
      } else {
        videoFormData.append("video", videoFile!);
        videoFormData.append("mode", "video");
      }
      
      videoFormData.append("dimension", dimension);
      videoFormData.append("subtitlePosition", subtitlePosition.toString());
      videoFormData.append("subtitleOutline", subtitleOutline.toString());
      videoFormData.append("subtitleSize", subtitleSize.toString());
      videoFormData.append("existingSubtitlesUrl", subtitleData.subtitlesUrl);
      
      const videoResponse = await fetch("/api/generate", {
        method: "POST",
        body: videoFormData,
      });
      
      if (!videoResponse.ok) {
        const errorData = await videoResponse.json();
        const errorMessage = errorData.error || videoResponse.statusText;
        
        // Check if it's a video processing error
        if (errorMessage.includes("FFmpeg") || errorMessage.includes("dimensions")) {
          if (imageFile && inputMode === "audio") {
            throw new Error("圖片處理發生問題。請嘗試使用標準尺寸的不同圖片。");
          } else if (videoFile && inputMode === "video") {
            throw new Error("影片處理發生問題。請嘗試使用不同的影片檔案。");
          } else {
            throw new Error("媒體處理發生問題。請重試。");
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const videoData = await videoResponse.json();
      setVideoUrl(videoData.videoUrl);
      setProgress(100);
      setIsGeneratingVideo(false);
      toast.success("影片生成成功！");
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "發生未知錯誤";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setIsGeneratingSubtitles(false);
      setIsGeneratingVideo(false);
    }
  };

  // Regenerate video with existing subtitles
  const regenerateVideoWithSubtitles = async () => {
    if (!subtitlesUrl) {
      toast.error("沒有可用的字幕檔案");
      return;
    }
    
    if (inputMode === "audio" && !audioFile) {
      toast.error("請上傳音訊檔案");
      return;
    }
    
    if (inputMode === "video" && !videoFile) {
      toast.error("請上傳影片檔案");
      return;
    }
    
    setIsLoading(true);
    setError("");
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 5;
      });
    }, 1000);
    
    try {
      // First, save the edited subtitles
      let currentSubtitlesUrl = subtitlesUrl;
      
      if (subtitleEditorRef.current) {
        const vttContent = subtitleEditorRef.current.getSubtitlesContent();
        
        const saveResponse = await fetch('/api/subtitles/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ vttContent }),
        });
        
        if (!saveResponse.ok) {
          throw new Error('無法儲存字幕');
        }
        
        const saveData = await saveResponse.json();
        currentSubtitlesUrl = saveData.subtitlesUrl;
        setSubtitlesUrl(currentSubtitlesUrl);
      }
      
      // Then generate video with the saved subtitles
      const formData = new FormData();
      
      if (inputMode === "audio") {
        formData.append("audio", audioFile!);
        if (imageFile) formData.append("image", imageFile);
        formData.append("mode", "audio");
      } else {
        formData.append("video", videoFile!);
        formData.append("mode", "video");
      }
      
      formData.append("dimension", dimension);
      formData.append("subtitlePosition", subtitlePosition.toString());
      formData.append("subtitleOutline", subtitleOutline.toString());
      formData.append("subtitleSize", subtitleSize.toString());
      formData.append("existingSubtitlesUrl", currentSubtitlesUrl);
      
      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "重新生成影片失敗");
      }
      
      const data = await response.json();
      setVideoUrl(data.videoUrl);
      setProgress(100);
      toast.success("影片重新生成成功！");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "發生未知錯誤";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      clearInterval(progressInterval);
      setIsLoading(false);
    }
  };

  const getPositionIcon = () => {
    switch(subtitlePosition) {
      case 1: return <AlignLeft className="h-4 w-4" />;
      case 2: return <AlignCenter className="h-4 w-4" />;
      case 3: return <AlignRight className="h-4 w-4" />;
      default: return <AlignJustify className="h-4 w-4" />;
    }
  };

  // Calculate subtitle style for preview
  const subtitleStyle = useMemo(() => {
    // Get dimensions based on selected resolution
    const dimensions = {
      '480p': { width: 854, height: 480 },
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 }
    }[dimension] || { width: 1280, height: 720 };
    
    // Calculate scale factor for the preview container
    // This makes font size relative to the selected output resolution
    const previewWidth = 100; // 100% of container width
    const scaleFactor = previewWidth / dimensions.width;
    
    const textAlign = subtitlePosition === 1 ? 'left' : subtitlePosition === 3 ? 'right' : 'center';
    const width = subtitlePosition === 2 ? '80%' : '90%';
    const left = subtitlePosition === 1 ? '5%' : subtitlePosition === 3 ? 'auto' : '10%';
    const right = subtitlePosition === 3 ? '5%' : 'auto';
    
    // Scale font size according to selected output resolution
    const scaledFontSize = Math.round(subtitleSize * scaleFactor * 100) / 100;
    
    return {
      position: 'absolute' as const, 
      bottom: '20px',
      left,
      right,
      width,
      textAlign: textAlign as 'left' | 'center' | 'right',
      fontSize: `${scaledFontSize}vw`, // Use vw units for responsive scaling
      color: 'white',
      fontFamily: 'Helvetica, Arial, sans-serif',
      fontWeight: 500,
      textShadow: subtitleOutline > 0 
        ? `0 0 ${subtitleOutline * scaleFactor * 2}vw black, 0 0 ${subtitleOutline * scaleFactor}vw black` 
        : 'none',
      padding: '6px',
      lineHeight: 1.2,
      zIndex: 10
    };
  }, [subtitlePosition, subtitleOutline, subtitleSize, dimension]);
  
  // Download subtitles function
  const downloadSubtitles = async (format: string = 'vtt') => {
    if (!subtitlesUrl) return;
    
    try {
      await downloadSubtitleWithFormat(subtitlesUrl, format);
      toast.success(`字幕已下載為 ${format.toUpperCase()} 格式`);
      setShowSubtitleFormats(false);
    } catch (error) {
      toast.error("下載字幕失敗: " + (error instanceof Error ? error.message : "未知錯誤"));
    }
  };

  // Listen to video playback
  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentVideoTime(videoRef.current.currentTime);
    }
  };

  return (
    <main className="flex min-h-screen flex-col p-4 md:p-8">
      <EnvironmentCheck />
      
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Left column: Control panel */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-xl">設定影片參數</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="audio" value={inputMode} onValueChange={handleModeChange} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="audio" className="flex items-center gap-2">
                  <AudioLines className="h-4 w-4" />
                  音訊 + 圖片
                </TabsTrigger>
                <TabsTrigger value="video" className="flex items-center gap-2">
                  <VideoIcon className="h-4 w-4" />
                  影片
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {inputMode === "audio" ? (
                /* Audio + Image mode */
                <>
                  <div className="space-y-2">
                    <Label htmlFor="audio-file" className="flex items-center gap-2">
                      <AudioLines className="h-4 w-4" /> 
                      音訊檔案 <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <Input
                          id="audio-file"
                          type="file"
                          accept="audio/*"
                          onChange={handleAudioChange}
                          disabled={isLoading}
                          required
                        />
                      </div>
                      {audioFile && (
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          type="button"
                          className="h-9 w-9 shrink-0"
                          onClick={() => {
                            setAudioFile(null);
                            setAudioPreviewUrl("");
                          }}
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">清除音訊</span>
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">MP3, WAV, M4A, AAC (最大 50MB)</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="image-file" className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      背景圖片 <span className="text-xs text-muted-foreground">(選擇性)</span>
                    </Label>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <Input
                          id="image-file"
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleImageChange}
                          disabled={isLoading}
                        />
                      </div>
                      {imageFile && (
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          type="button"
                          className="h-9 w-9 shrink-0"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreviewUrl("");
                          }}
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">清除圖片</span>
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, GIF, WebP (最大 10MB)</p>
                  </div>
                </>
              ) : (
                /* Video mode */
                <div className="space-y-2">
                  <Label htmlFor="video-file" className="flex items-center gap-2">
                    <VideoIcon className="h-4 w-4" /> 
                    影片檔案 <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Input
                        id="video-file"
                        type="file"
                        accept="video/*"
                        onChange={handleVideoChange}
                        disabled={isLoading}
                        required
                      />
                    </div>
                    {videoFile && (
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        type="button"
                        className="h-9 w-9 shrink-0"
                        onClick={() => {
                          setVideoFile(null);
                          setVideoPreviewUrl("");
                        }}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">清除影片</span>
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">MP4, MOV, WebM (最大 100MB)</p>
                </div>
              )}
              
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <VideoIcon className="h-4 w-4" />
                  輸出解析度 <span className="text-xs text-muted-foreground">(選擇性)</span>
                </Label>
                <RadioGroup 
                  defaultValue="720p" 
                  value={dimension} 
                  onValueChange={setDimension}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="480p" id="480p" />
                    <Label htmlFor="480p" className="cursor-pointer">480p</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="720p" id="720p" />
                    <Label htmlFor="720p" className="cursor-pointer">720p</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1080p" id="1080p" />
                    <Label htmlFor="1080p" className="cursor-pointer">1080p</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-3 pt-2">
                <Label className="flex items-center gap-2">
                  {getPositionIcon()}
                  字幕位置
                </Label>
                <RadioGroup 
                  value={subtitlePosition.toString()} 
                  onValueChange={(value) => setSubtitlePosition(parseInt(value))}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="left" />
                    <Label htmlFor="left" className="cursor-pointer">靠左</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="center" />
                    <Label htmlFor="center" className="cursor-pointer">置中</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3" id="right" />
                    <Label htmlFor="right" className="cursor-pointer">靠右</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-3 pt-2">
                <Label>字型大小: {subtitleSize}px</Label>
                <Slider 
                  value={[subtitleSize]}
                  min={16}
                  max={48}
                  step={2}
                  onValueChange={(value: number[]) => setSubtitleSize(value[0])}
                />
              </div>
              
              <div className="space-y-3 pt-2">
                <Label>外框強度: {subtitleOutline}</Label>
                <Slider 
                  value={[subtitleOutline]}
                  min={0}
                  max={5}
                  step={1}
                  onValueChange={(value: number[]) => setSubtitleOutline(value[0])}
                />
                <p className="text-xs text-muted-foreground">
                  {subtitleOutline === 0 ? "無外框" : subtitleOutline === 1 ? "細外框" : subtitleOutline >= 4 ? "粗外框" : "中等外框"}
                </p>
              </div>
              
              <div className="space-y-3 pt-2">
                <Label htmlFor="subtitle-text">字幕預覽文字</Label>
                <Input
                  id="subtitle-text"
                  value={subtitleText}
                  onChange={(e) => setSubtitleText(e.target.value)}
                  placeholder="輸入字幕預覽文字"
                />
              </div>
              
              <Button
                type="submit"
                className="w-full mt-4"
                disabled={isLoading || (inputMode === "audio" && !audioFile) || (inputMode === "video" && !videoFile)}
              >
                {isLoading ? "處理中..." : (
                  <span className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    生成含字幕的影片
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Right column: Preview & Progress */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-xl">預覽</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preview based on input mode */}
            {inputMode === "audio" ? (
              /* Image Preview with Subtitle Overlay */
              imagePreviewUrl ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">含字幕的預覽 <span className="text-xs text-muted-foreground">({dimension})</span></h3>
                  <div 
                    className="relative bg-black overflow-hidden rounded-md" 
                    style={{ 
                      aspectRatio: dimension === '480p' ? '854/480' : dimension === '1080p' ? '1920/1080' : '1280/720'
                    }}
                  >
                    <Image 
                      src={imagePreviewUrl} 
                      alt="背景預覽" 
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div style={subtitleStyle}>
                      {subtitleText || "預覽字幕效果"}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    預覽已縮放至符合 {dimension} 輸出 ({dimension === '480p' ? '854×480' : dimension === '1080p' ? '1920×1080' : '1280×720'})
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">字幕預覽 <span className="text-xs text-muted-foreground">({dimension})</span></h3>
                  <div 
                    className="relative bg-black overflow-hidden rounded-md flex items-center justify-center" 
                    style={{ 
                      aspectRatio: dimension === '480p' ? '854/480' : dimension === '1080p' ? '1920/1080' : '1280/720'
                    }}
                  >
                    <div style={subtitleStyle}>
                      {subtitleText || "預覽字幕效果"}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    預覽已縮放至符合 {dimension} 輸出 ({dimension === '480p' ? '854×480' : dimension === '1080p' ? '1920×1080' : '1280×720'})
                  </p>
                </div>
              )
            ) : (
              /* Video Preview with Subtitle Overlay */
              videoPreviewUrl ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">影片預覽</h3>
                  <div className="relative bg-black overflow-hidden rounded-md">
                    <video 
                      src={videoPreviewUrl} 
                      controls 
                      className="w-full"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      原始影片（字幕將在處理過程中疊加）
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-medium">字幕樣式預覽</h3>
                    <div 
                      className="relative bg-black overflow-hidden rounded-md mt-2" 
                      style={{ 
                        aspectRatio: dimension === '480p' ? '854/480' : dimension === '1080p' ? '1920/1080' : '1280/720'
                      }}
                    >
                      <div style={subtitleStyle}>
                        {subtitleText || "預覽字幕效果"}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">影片預覽</h3>
                  <div 
                    className="bg-black/10 border border-dashed border-muted-foreground/50 rounded-md flex flex-col items-center justify-center p-6"
                    style={{ 
                      aspectRatio: dimension === '480p' ? '854/480' : dimension === '1080p' ? '1920/1080' : '1280/720' 
                    }}
                  >
                    <VideoIcon className="h-10 w-10 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">上傳影片以查看預覽</p>
                  </div>
                </div>
              )
            )}
            
            {/* Audio Preview (Audio mode only) */}
            {inputMode === "audio" && audioPreviewUrl && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">音訊預覽</h3>
                <audio controls className="w-full" src={audioPreviewUrl}></audio>
              </div>
            )}
            
            {/* Processing indicators */}
            {isLoading && (
              <div className="space-y-4">
                <ProcessingSteps isProcessing={isLoading} />
                <Progress value={progress} className="h-2" />
                <div className="text-sm text-center text-muted-foreground space-y-1">
                  <p>{progress}% 完成</p>
                  {isGeneratingSubtitles && <p className="text-blue-600">🎯 正在轉錄音訊生成字幕...</p>}
                  {subtitlesReady && isGeneratingVideo && <p className="text-green-600">✅ 字幕已完成！正在生成影片...</p>}
                </div>
              </div>
            )}
            
            {/* Subtitle Download Section - Shows as soon as subtitles are ready */}
            {subtitlesReady && (
              <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <h3 className="font-medium">字幕已準備完成！</h3>
                </div>
                <p className="text-sm text-green-600 mb-3">
                  您可以立即下載字幕檔案，或等待影片完成後一起下載。SRT 格式與 YouTube CC 字幕完全相容。
                </p>
                <div className="flex flex-wrap gap-2">
                  {/* YouTube Compatible SRT Download - Primary Button */}
                  <Button 
                    onClick={() => downloadSubtitles('srt')}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                  >
                    <Download className="h-4 w-4" />
                    下載 YouTube CC 字幕 (SRT) ⭐
                  </Button>
                  
                  {/* Other Format Dropdown */}
                  <div className="relative subtitle-format-dropdown">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowSubtitleFormats(!showSubtitleFormats)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      其他格式
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    {showSubtitleFormats && (
                      <div className="absolute top-full mt-1 left-0 bg-background border rounded-md shadow-lg z-10 py-1 min-w-[200px]">
                        <button
                          onClick={() => downloadSubtitles('vtt')}
                          className="w-full px-3 py-2 text-sm hover:bg-accent text-left"
                        >
                          WebVTT (.vtt) - 網頁字幕標準
                        </button>
                        <button
                          onClick={() => downloadSubtitles('txt')}
                          className="w-full px-3 py-2 text-sm hover:bg-accent text-left"
                        >
                          純文字 (.txt) - 僅文字內容
                        </button>
                        <button
                          onClick={() => downloadSubtitles('ass')}
                          className="w-full px-3 py-2 text-sm hover:bg-accent text-left"
                        >
                          ASS/SSA (.ass) - 進階樣式字幕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Error display */}
            {error && (
              <div className="mt-4 text-destructive p-3 bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Bottom Section: Output (Full Width) */}
      {(videoUrl || subtitlesUrl) && (
        <Card className="w-full mt-6">
          <CardHeader>
            <CardTitle className="text-xl">輸出結果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Generated Video */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">生成的影片</h3>
                {videoUrl && (
                  <>
                    <div className="overflow-hidden rounded-lg">
                      <video 
                        ref={videoRef}
                        src={videoUrl} 
                        controls 
                        className="w-full"
                        onTimeUpdate={handleVideoTimeUpdate}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="default" className="flex-1">
                        <a href={videoUrl} download className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          下載影片
                        </a>
                      </Button>
                      {subtitlesUrl && (
                        <div className="relative subtitle-format-dropdown">
                          <Button 
                            variant="outline" 
                            onClick={() => setShowSubtitleFormats(!showSubtitleFormats)}
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            下載字幕
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          {showSubtitleFormats && (
                            <div className="absolute top-full mt-1 right-0 bg-background border rounded-md shadow-lg z-10 py-1 min-w-[220px]">
                              <button
                                onClick={() => downloadSubtitles('srt')}
                                className="w-full px-3 py-2 text-sm hover:bg-accent text-left border-b"
                              >
                                <div className="flex items-center justify-between">
                                  <span>SubRip (.srt)</span>
                                  <span className="text-xs text-red-600 font-medium">⭐ YouTube</span>
                                </div>
                                <div className="text-xs text-muted-foreground">YouTube/大多數平台相容</div>
                              </button>
                              <button
                                onClick={() => downloadSubtitles('vtt')}
                                className="w-full px-3 py-2 text-sm hover:bg-accent text-left"
                              >
                                <div>WebVTT (.vtt)</div>
                                <div className="text-xs text-muted-foreground">網頁字幕標準</div>
                              </button>
                              <button
                                onClick={() => downloadSubtitles('txt')}
                                className="w-full px-3 py-2 text-sm hover:bg-accent text-left"
                              >
                                <div>純文字 (.txt)</div>
                                <div className="text-xs text-muted-foreground">僅文字內容</div>
                              </button>
                              <button
                                onClick={() => downloadSubtitles('ass')}
                                className="w-full px-3 py-2 text-sm hover:bg-accent text-left"
                              >
                                <div>ASS/SSA (.ass)</div>
                                <div className="text-xs text-muted-foreground">進階樣式字幕</div>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              {/* Right: Subtitles Editor */}
              {subtitlesUrl && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">字幕編輯器</h3>
                  
                  <SubtitleEditor 
                    ref={subtitleEditorRef}
                    subtitlesUrl={subtitlesUrl}
                    currentTime={currentVideoTime}
                  />
                  
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={regenerateVideoWithSubtitles}
                    disabled={isLoading}
                    className="w-full flex items-center gap-2"
                  >
                    <VideoIcon className="h-4 w-4" />
                    使用編輯後的字幕重新生成影片
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

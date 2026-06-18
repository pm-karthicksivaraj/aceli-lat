"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Square, Pause, Play } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onRecordingStart?: () => void;
}

export function VoiceRecorder({ onRecordingComplete, onRecordingStart }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(20).fill(0));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const durationRef = useRef(0);

  const stopAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const startAudioVisualization = useCallback(() => {
    const update = () => {
      if (!analyserRef.current) return;
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      const levels: number[] = [];
      const step = Math.floor(dataArray.length / 20);
      for (let i = 0; i < 20; i++) {
        levels.push(dataArray[i * step] / 255);
      }
      setAudioLevels(levels);
      animationRef.current = requestAnimationFrame(update);
    };
    animationRef.current = requestAnimationFrame(update);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onRecordingComplete(blob, durationRef.current);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      durationRef.current = 0;
      onRecordingStart?.();

      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration((prev) => prev + 1);
      }, 1000);

      startAudioVisualization();
    } catch {
      alert("Microphone access denied. You can still type notes below.");
    }
  }, [onRecordingComplete, onRecordingStart, startAudioVisualization]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
    stopAnimation();
    setIsRecording(false);
    setIsPaused(false);
    setAudioLevels(new Array(20).fill(0));
  }, [stopAnimation]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      stopAnimation();
      setIsPaused(true);
    }
  }, [stopAnimation]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration((prev) => prev + 1);
      }, 1000);
      startAudioVisualization();
      setIsPaused(false);
    }
  }, [startAudioVisualization]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopAnimation();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stopAnimation]);

  return (
    <Card className={cn("transition-all", isRecording && "ring-2 ring-red-300 border-red-200")}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isRecording ? (
              <Mic className="h-4 w-4 text-red-500 animate-pulse-recording" />
            ) : (
              <Mic className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium text-foreground">
              {isRecording ? "Recording..." : "Voice Memo"}
            </span>
          </div>
          {isRecording && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-red-300 text-red-600 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-pulse-recording" />
                REC
              </Badge>
              <span className="text-sm font-mono text-foreground">
                {formatDuration(duration)}
              </span>
            </div>
          )}
        </div>

        {/* Waveform visualization */}
        {isRecording && (
          <div className="flex items-end gap-0.5 h-12 mb-3 px-1">
            {audioLevels.map((level, i) => (
              <div
                key={i}
                className="flex-1 bg-aceli rounded-sm transition-all duration-75"
                style={{
                  height: `${Math.max(4, level * 100)}%`,
                  opacity: 0.4 + level * 0.6,
                }}
              />
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full w-14 h-14"
              size="icon"
            >
              <Mic className="h-6 w-6" />
            </Button>
          ) : (
            <>
              {isPaused ? (
                <Button
                  onClick={resumeRecording}
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                >
                  <Play className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={pauseRecording}
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                >
                  <Pause className="h-4 w-4" />
                </Button>
              )}
              <Button
                onClick={stopRecording}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full w-12 h-12"
                size="icon"
              >
                <Square className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <MicOff className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {!isRecording && duration === 0 && (
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Tap the red button to start recording
          </p>
        )}
      </CardContent>
    </Card>
  );
}

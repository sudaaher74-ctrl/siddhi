"use client";

import React, { useState, useEffect, useRef } from "react";
import Card from "@/components/ui/Card";
import { Play, Pause, RotateCcw } from "lucide-react";

interface ArcheryTimerProps {
  resetCount: number;
}

export default function ArcheryTimer({ resetCount }: ArcheryTimerProps) {
  const TOTAL_SECONDS = 180; // 3 minutes
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  
  // Track if we already played the buzzer for this round
  const hasBuzzedRef = useRef(false);

  useEffect(() => {
    // Reset timer when resetCount changes
    setTimeLeft(TOTAL_SECONDS);
    setIsRunning(false);
    hasBuzzedRef.current = false;
  }, [resetCount]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !hasBuzzedRef.current) {
      hasBuzzedRef.current = true;
      setIsRunning(false);
      playBuzzer();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const playBuzzer = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create oscillator for beep
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      // Archery buzzer is usually a harsh square or sawtooth wave
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      
      // Volume envelope
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 1.5); // Hold for 1.5s
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.6);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 1.6);
    } catch (err) {
      console.warn("AudioContext not supported or blocked", err);
    }
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setTimeLeft(TOTAL_SECONDS);
    setIsRunning(false);
    hasBuzzedRef.current = false;
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progressPercentage = (timeLeft / TOTAL_SECONDS) * 100;
  
  // Change color based on time left (e.g., last 30 seconds goes red/yellow)
  let circleColor = "text-accent";
  if (timeLeft <= 30) circleColor = "text-gold";
  if (timeLeft <= 10) circleColor = "text-[#E53935]";

  return (
    <Card>
      <div className="flex flex-col items-center justify-center p-2">
        <h2 className="text-[12px] font-semibold text-text-dim uppercase tracking-wider mb-4">
          End Timer
        </h2>
        
        {/* Circular Progress Timer */}
        <div className="relative w-32 h-32 flex items-center justify-center mb-6">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="60"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="6"
              className="text-black/5"
            />
            <circle
              cx="64"
              cy="64"
              r="60"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="6"
              strokeDasharray={377}
              strokeDashoffset={377 - (377 * progressPercentage) / 100}
              className={`transition-all duration-1000 ease-linear ${circleColor}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-4xl font-mono font-bold ${timeLeft === 0 ? "text-[#E53935]" : "text-black"}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleStartPause}
            className="w-12 h-12 flex items-center justify-center bg-black/5 hover:bg-black/10 rounded-full transition-colors"
          >
            {isRunning ? <Pause className="w-5 h-5 text-black" /> : <Play className="w-5 h-5 text-black ml-1" />}
          </button>
          
          <button
            onClick={handleReset}
            className="w-12 h-12 flex items-center justify-center bg-black/5 hover:bg-black/10 rounded-full transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-black" />
          </button>
        </div>
      </div>
    </Card>
  );
}

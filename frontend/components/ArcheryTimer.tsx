"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Card from "@/components/ui/Card";
import { Play, Pause, RotateCcw, Volume2, BellOff } from "lucide-react";

interface ArcheryTimerProps {
  resetCount: number;
}

type WakeLock = { release: () => Promise<void> };

export default function ArcheryTimer({ resetCount }: ArcheryTimerProps) {
  const TOTAL_SECONDS = 180; // 3 minutes
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [isAlarming, setIsAlarming] = useState(false);

  // Track if we already played the buzzer for this round
  const hasBuzzedRef = useRef(false);
  // A single AudioContext, unlocked on the first user tap (required on iOS/Android)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const wakeLockRef = useRef<WakeLock | null>(null);
  // Absolute end time so the countdown stays correct if the browser throttles timers
  const endsAtRef = useRef<number | null>(null);
  // Last whole second we rendered, so warning beeps fire exactly once
  const lastTickRef = useRef(TOTAL_SECONDS);

  const getAudioCtx = useCallback((): AudioContext | null => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return null;
        audioCtxRef.current = new AudioContextClass();
      }
      if (audioCtxRef.current.state === "suspended") {
        void audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch (err) {
      console.warn("AudioContext not supported or blocked", err);
      return null;
    }
  }, []);

  // Play one harsh buzzer blast starting `offset` seconds from now.
  const blast = useCallback((ctx: AudioContext, offset: number, duration: number) => {
    const t = ctx.currentTime + offset;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(440, t); // A4

    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(1, t + 0.05);
    gainNode.gain.setValueAtTime(1, t + duration - 0.05);
    gainNode.gain.linearRampToValueAtTime(0, t + duration);

    oscillator.start(t);
    oscillator.stop(t + duration);
  }, []);

  const playBuzzer = useCallback(() => {
    const ctx = getAudioCtx();
    if (ctx) {
      // Two short blasts + one long, like a real shooting line buzzer
      blast(ctx, 0, 0.5);
      blast(ctx, 0.7, 0.5);
      blast(ctx, 1.4, 1.5);
    }
    // Vibrate as well — works even when the phone is on silent
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([400, 200, 400, 200, 900]);
    }
  }, [blast, getAudioCtx]);

  // Warning beep at 30s and 10s so you hear the clock without looking
  const warningBeep = useCallback(() => {
    const ctx = getAudioCtx();
    if (ctx) blast(ctx, 0, 0.15);
  }, [blast, getAudioCtx]);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      void wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  }, []);

  const requestWakeLock = useCallback(async () => {
    try {
      const wl = (navigator as unknown as {
        wakeLock?: { request: (type: "screen") => Promise<WakeLock> };
      }).wakeLock;
      if (wl && !wakeLockRef.current) {
        wakeLockRef.current = await wl.request("screen");
      }
    } catch {
      // Screen lock isn't critical — ignore if unsupported/denied
    }
  }, []);

  useEffect(() => {
    // Reset timer when resetCount changes
    setTimeLeft(TOTAL_SECONDS);
    setIsRunning(false);
    setIsAlarming(false);
    hasBuzzedRef.current = false;
    endsAtRef.current = null;
    lastTickRef.current = TOTAL_SECONDS;
  }, [resetCount]);

  useEffect(() => {
    if (!isRunning) return;

    if (endsAtRef.current === null) {
      endsAtRef.current = Date.now() + timeLeft * 1000;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.round(((endsAtRef.current ?? 0) - Date.now()) / 1000));
      if (remaining !== lastTickRef.current) {
        if (remaining === 30 || remaining === 10) warningBeep();
        lastTickRef.current = remaining;
        setTimeLeft(remaining);
      }
    };

    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
    // timeLeft is intentionally excluded: the interval reads the absolute end time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, warningBeep]);

  useEffect(() => {
    if (timeLeft === 0 && !hasBuzzedRef.current) {
      hasBuzzedRef.current = true;
      setIsRunning(false);
      setIsAlarming(true);
      endsAtRef.current = null;
      releaseWakeLock();
      playBuzzer();
    }
  }, [timeLeft, playBuzzer, releaseWakeLock]);

  // Re-acquire the screen lock when returning to the tab mid-round
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && isRunning) void requestWakeLock();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isRunning, requestWakeLock]);

  useEffect(() => releaseWakeLock, [releaseWakeLock]);

  const handleStartPause = () => {
    // This tap is the user gesture that unlocks audio on mobile browsers
    getAudioCtx();

    if (isRunning) {
      endsAtRef.current = null;
      setIsRunning(false);
      releaseWakeLock();
    } else {
      if (timeLeft === 0) return;
      setIsAlarming(false);
      lastTickRef.current = timeLeft;
      endsAtRef.current = Date.now() + timeLeft * 1000;
      setIsRunning(true);
      void requestWakeLock();
    }
  };

  const handleReset = () => {
    getAudioCtx();
    setTimeLeft(TOTAL_SECONDS);
    setIsRunning(false);
    setIsAlarming(false);
    hasBuzzedRef.current = false;
    endsAtRef.current = null;
    lastTickRef.current = TOTAL_SECONDS;
    releaseWakeLock();
  };

  const handleTestSound = () => {
    playBuzzer();
  };

  const handleStopAlarm = () => {
    setIsAlarming(false);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(0);
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
        <div className={`relative w-32 h-32 flex items-center justify-center mb-6 ${isAlarming ? "animate-pulse" : ""}`}>
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
              className={`transition-all duration-300 ease-linear ${circleColor}`}
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
            aria-label={isRunning ? "Pause timer" : "Start timer"}
            className="w-12 h-12 flex items-center justify-center bg-black/5 hover:bg-black/10 rounded-full transition-colors"
          >
            {isRunning ? <Pause className="w-5 h-5 text-black" /> : <Play className="w-5 h-5 text-black ml-1" />}
          </button>

          <button
            onClick={handleReset}
            aria-label="Reset timer"
            className="w-12 h-12 flex items-center justify-center bg-black/5 hover:bg-black/10 rounded-full transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-black" />
          </button>

          <button
            onClick={isAlarming ? handleStopAlarm : handleTestSound}
            aria-label={isAlarming ? "Stop alarm" : "Test buzzer sound"}
            className="w-12 h-12 flex items-center justify-center bg-black/5 hover:bg-black/10 rounded-full transition-colors"
          >
            {isAlarming ? <BellOff className="w-5 h-5 text-black" /> : <Volume2 className="w-5 h-5 text-black" />}
          </button>
        </div>

        <p className="mt-3 text-[11px] text-text-dim text-center">
          {isAlarming
            ? "Time! End of this end."
            : "Tap the speaker once to test the buzzer — phones only allow sound after a tap."}
        </p>
      </div>
    </Card>
  );
}

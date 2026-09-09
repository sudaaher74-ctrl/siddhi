"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Card from "@/components/ui/Card";
import { Play, Pause, RotateCcw, Volume2, BellOff, Bell, AlarmClock } from "lucide-react";

interface ArcheryTimerProps {
  resetCount: number;
}

type WakeLock = { release: () => Promise<void> };

type LeadInStep = "1" | "2" | "3" | "START" | null;

export default function ArcheryTimer({ resetCount }: ArcheryTimerProps) {
  const [totalSeconds, setTotalSeconds] = useState(180); // 180 sec (3 min) standard end
  const [timeLeft, setTimeLeft] = useState(180);
  const [isRunning, setIsRunning] = useState(false);
  const [isAlarming, setIsAlarming] = useState(false);
  const [leadInStep, setLeadInStep] = useState<LeadInStep>(null);
  const [voiceLeadInEnabled, setVoiceLeadInEnabled] = useState(true);

  // Track if we already started alarming for this countdown
  const hasBuzzedRef = useRef(false);
  const hasSpoken30sRef = useRef(false);
  const hasSpoken10sRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const wakeLockRef = useRef<WakeLock | null>(null);
  const endsAtRef = useRef<number | null>(null);
  const lastTickRef = useRef(180);
  const leadInTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Web Speech API synthesis
  const speak = useCallback((text: string) => {
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn("SpeechSynthesis error:", err);
    }
  }, []);

  // Play a single audio tone with AudioContext
  const playTone = useCallback((freq: number, duration: number, type: OscillatorType = "sine", gainVal = 0.3) => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(gainVal, t + 0.02);
    gain.gain.setValueAtTime(gainVal, t + duration - 0.03);
    gain.gain.linearRampToValueAtTime(0, t + duration);

    osc.start(t);
    osc.stop(t + duration);
  }, [getAudioCtx]);

  // Lead-in tones: 600Hz for 1-2-3, double chime for START
  const playLeadInBeep = useCallback(() => {
    playTone(600, 0.2, "sine", 0.35);
  }, [playTone]);

  const playStartChime = useCallback(() => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(880, t);
    osc2.frequency.setValueAtTime(1174, t); // D6

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.5);
    osc2.stop(t + 0.5);
  }, [getAudioCtx]);

  // Play harsh buzzer blast for time-up alarm
  const blast = useCallback((ctx: AudioContext, offset: number, duration: number) => {
    const t = ctx.currentTime + offset;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(440, t);

    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.7, t + 0.04);
    gainNode.gain.setValueAtTime(0.7, t + duration - 0.04);
    gainNode.gain.linearRampToValueAtTime(0, t + duration);

    oscillator.start(t);
    oscillator.stop(t + duration);
  }, []);

  // Alarm burst pattern (rings continuously like an alarm clock)
  const playAlarmBurst = useCallback(() => {
    const ctx = getAudioCtx();
    if (ctx) {
      blast(ctx, 0, 0.25);
      blast(ctx, 0.35, 0.25);
      blast(ctx, 0.7, 0.5);
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([250, 100, 250, 100, 500]);
    }
  }, [blast, getAudioCtx]);

  // Warning beeps at 30s and 10s
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
      // Screen lock isn't critical
    }
  }, []);

  // Clear all pending lead-in timers
  const clearLeadIn = useCallback(() => {
    leadInTimeoutsRef.current.forEach(clearTimeout);
    leadInTimeoutsRef.current = [];
    setLeadInStep(null);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Clear continuous alarm loop
  const stopAlarmLoop = useCallback(() => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    setIsAlarming(false);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(0);
    }
  }, []);

  // Start continuous alarm loop
  const startAlarmLoop = useCallback(() => {
    stopAlarmLoop();
    setIsAlarming(true);
    playAlarmBurst();
    alarmIntervalRef.current = setInterval(playAlarmBurst, 2000);
  }, [playAlarmBurst, stopAlarmLoop]);

  // Reset timer when resetCount changes
  useEffect(() => {
    clearLeadIn();
    stopAlarmLoop();
    setTimeLeft(totalSeconds);
    setIsRunning(false);
    hasBuzzedRef.current = false;
    hasSpoken30sRef.current = false;
    hasSpoken10sRef.current = false;
    endsAtRef.current = null;
    lastTickRef.current = totalSeconds;
    releaseWakeLock();
  }, [resetCount, clearLeadIn, stopAlarmLoop, releaseWakeLock, totalSeconds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLeadIn();
      stopAlarmLoop();
      releaseWakeLock();
    };
  }, [clearLeadIn, stopAlarmLoop, releaseWakeLock]);

  // Countdown timer loop
  useEffect(() => {
    if (!isRunning) return;

    if (endsAtRef.current === null) {
      endsAtRef.current = Date.now() + timeLeft * 1000;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.round(((endsAtRef.current ?? 0) - Date.now()) / 1000));
      if (remaining !== lastTickRef.current) {
        // 30 seconds and 10 seconds warnings
        if (lastTickRef.current > 30 && remaining <= 30) {
          warningBeep();
          if (voiceLeadInEnabled && !hasSpoken30sRef.current) {
            hasSpoken30sRef.current = true;
            speak("30 seconds left");
          }
        } else if (lastTickRef.current > 10 && remaining <= 10) {
          warningBeep();
          if (voiceLeadInEnabled && !hasSpoken10sRef.current) {
            hasSpoken10sRef.current = true;
            speak("10 seconds left");
          }
        }
        lastTickRef.current = remaining;
        setTimeLeft(remaining);
      }
    };

    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, warningBeep, speak, voiceLeadInEnabled]);

  // Trigger continuous alarm when time reaches 0
  useEffect(() => {
    if (timeLeft === 0 && !hasBuzzedRef.current && !leadInStep) {
      hasBuzzedRef.current = true;
      setIsRunning(false);
      endsAtRef.current = null;
      releaseWakeLock();
      startAlarmLoop();
    }
  }, [timeLeft, leadInStep, releaseWakeLock, startAlarmLoop]);

  // Re-acquire screen lock on tab visibility change
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && isRunning) void requestWakeLock();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isRunning, requestWakeLock]);

  // Start the 1-2-3-Start lead in sequence
  const startLeadInCountdown = () => {
    clearLeadIn();
    stopAlarmLoop();
    setIsRunning(false);

    // Step 1: "1"
    setLeadInStep("1");
    speak("1");
    playLeadInBeep();

    // Step 2: "2" after 1s
    const t1 = setTimeout(() => {
      setLeadInStep("2");
      speak("2");
      playLeadInBeep();
    }, 1000);

    // Step 3: "3" after 2s
    const t2 = setTimeout(() => {
      setLeadInStep("3");
      speak("3");
      playLeadInBeep();
    }, 2000);

    // Step 4: "START!" after 3s
    const t3 = setTimeout(() => {
      setLeadInStep("START");
      speak("Start!");
      playStartChime();
    }, 3000);

    // Step 5: Start clock after brief display of START (3.7s total)
    const t4 = setTimeout(() => {
      setLeadInStep(null);
      lastTickRef.current = timeLeft;
      endsAtRef.current = Date.now() + timeLeft * 1000;
      setIsRunning(true);
      void requestWakeLock();
    }, 3700);

    leadInTimeoutsRef.current = [t1, t2, t3, t4];
  };

  const handleStartPause = () => {
    getAudioCtx();

    // If currently counting down lead-in, cancel it
    if (leadInStep !== null) {
      clearLeadIn();
      return;
    }

    if (isRunning) {
      endsAtRef.current = null;
      setIsRunning(false);
      releaseWakeLock();
    } else {
      if (timeLeft === 0) return;
      stopAlarmLoop();

      // If starting fresh and voice lead-in is enabled, trigger 1-2-3-Start
      if (voiceLeadInEnabled && timeLeft === totalSeconds) {
        hasSpoken30sRef.current = false;
        hasSpoken10sRef.current = false;
        startLeadInCountdown();
      } else {
        if (timeLeft > 30) hasSpoken30sRef.current = false;
        if (timeLeft > 10) hasSpoken10sRef.current = false;
        lastTickRef.current = timeLeft;
        endsAtRef.current = Date.now() + timeLeft * 1000;
        setIsRunning(true);
        void requestWakeLock();
      }
    }
  };

  const handleReset = () => {
    getAudioCtx();
    clearLeadIn();
    stopAlarmLoop();
    setTimeLeft(totalSeconds);
    setIsRunning(false);
    hasBuzzedRef.current = false;
    hasSpoken30sRef.current = false;
    hasSpoken10sRef.current = false;
    endsAtRef.current = null;
    lastTickRef.current = totalSeconds;
    releaseWakeLock();
  };

  const handleSelectDuration = (sec: number) => {
    getAudioCtx();
    clearLeadIn();
    stopAlarmLoop();
    setTotalSeconds(sec);
    setTimeLeft(sec);
    setIsRunning(false);
    hasBuzzedRef.current = false;
    hasSpoken30sRef.current = false;
    hasSpoken10sRef.current = false;
    endsAtRef.current = null;
    lastTickRef.current = sec;
    releaseWakeLock();
  };

  // Alarm Snooze (+30 seconds like an alarm clock)
  const handleSnooze = (snoozeSeconds = 30) => {
    getAudioCtx();
    clearLeadIn();
    stopAlarmLoop();
    hasBuzzedRef.current = false;
    hasSpoken30sRef.current = snoozeSeconds <= 30;
    hasSpoken10sRef.current = false;

    // Reset clock to snooze duration and immediately resume countdown
    setTimeLeft(snoozeSeconds);
    lastTickRef.current = snoozeSeconds;
    endsAtRef.current = Date.now() + snoozeSeconds * 1000;
    setIsRunning(true);
    void requestWakeLock();
    speak(`Snoozed ${snoozeSeconds} seconds`);
  };

  const handleStopAlarm = () => {
    stopAlarmLoop();
  };

  const handleTestSound = () => {
    playAlarmBurst();
  };

  const progressPercentage = (timeLeft / totalSeconds) * 100;

  // Change ring color based on time left
  let circleColor = "text-accent";
  if (timeLeft <= 30) circleColor = "text-amber-500";
  if (timeLeft <= 10) circleColor = "text-[#E53935]";

  return (
    <Card>
      <div className={`flex flex-col items-center justify-center p-2 transition-colors ${
        isAlarming ? "bg-red-50/50 rounded-xl" : ""
      }`}>
        <div className="w-full flex items-center justify-between mb-2 px-1">
          <h2 className="text-[12px] font-semibold text-text-dim uppercase tracking-wider flex items-center gap-1.5">
            <AlarmClock className="w-3.5 h-3.5 text-accent" />
            End Timer
          </h2>

          {/* Voice toggle */}
          <button
            type="button"
            onClick={() => setVoiceLeadInEnabled(!voiceLeadInEnabled)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              voiceLeadInEnabled
                ? "bg-accent/10 text-accent border border-accent/20"
                : "bg-black/5 text-text-dim hover:text-text border border-transparent"
            }`}
            title="When active, timer speaks '1, 2, 3, Start!' and announces '30 seconds left'"
          >
            <span>VOICE: {voiceLeadInEnabled ? "ON (Start & 30s)" : "OFF"}</span>
          </button>
        </div>

        {/* Quick Seconds Duration Presets */}
        <div className="flex items-center justify-center gap-1.5 mb-3.5 bg-slate-100/90 p-1 rounded-xl">
          {[
            { label: "120 sec", value: 120 },
            { label: "180 sec", value: 180 },
            { label: "240 sec", value: 240 },
          ].map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handleSelectDuration(preset.value)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                totalSeconds === preset.value
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Circular Progress Timer */}
        <div className={`relative w-32 h-32 flex items-center justify-center mb-5 ${
          isAlarming ? "animate-pulse" : ""
        }`}>
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

          {/* Center text: either Lead-in step ("1", "2", "3", "START!") or time remaining in seconds */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1">
            {leadInStep !== null ? (
              <div className="animate-bounce">
                <span className={`font-mono font-extrabold ${
                  leadInStep === "START" 
                    ? "text-2xl text-accent" 
                    : "text-4xl text-black"
                }`}>
                  {leadInStep}
                </span>
                <span className="block text-[9px] uppercase font-bold tracking-wider text-text-dim">
                  {leadInStep === "START" ? "SHOOT!" : "READY"}
                </span>
              </div>
            ) : isAlarming ? (
              <div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-mono font-bold text-[#E53935]">
                    0
                  </span>
                  <span className="text-xs font-bold uppercase text-[#E53935]">
                    sec
                  </span>
                </div>
                <span className="block text-[9px] font-bold text-accent uppercase tracking-wider animate-pulse">
                  TIME UP!
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-baseline justify-center gap-1">
                  <span className={`text-4xl font-mono font-bold tracking-tight transition-colors ${
                    timeLeft <= 10 ? "text-[#E53935]" : timeLeft <= 30 ? "text-amber-600" : "text-black"
                  }`}>
                    {timeLeft}
                  </span>
                  <span className={`text-sm font-bold uppercase transition-colors ${
                    timeLeft <= 10 ? "text-[#E53935]" : timeLeft <= 30 ? "text-amber-600" : "text-slate-400"
                  }`}>
                    sec
                  </span>
                </div>
                {timeLeft <= 30 && timeLeft > 0 && isRunning && (
                  <span className={`text-[9.5px] font-black uppercase tracking-wider animate-pulse px-2 py-0.5 rounded-full mt-0.5 ${
                    timeLeft <= 10
                      ? "bg-rose-100 text-rose-700 border border-rose-300"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}>
                    {timeLeft <= 10 ? "10s Alert!" : "30s Left"}
                  </span>
                )}
                {!isRunning && timeLeft < totalSeconds && timeLeft > 0 && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-0.5">
                    PAUSED
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Alarm Active Controls (Continuous Alarm & Snooze) */}
        {isAlarming ? (
          <div className="w-full max-w-[260px] flex flex-col gap-2 animate-fadeIn">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSnooze(30)}
                className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[12px] font-bold shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
              >
                <Bell className="w-4 h-4" />
                <span>Snooze (+30s)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSnooze(60)}
                className="py-2.5 px-3 bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 rounded-xl text-[12px] font-bold transition-colors"
                title="Snooze for 60 seconds"
              >
                +60s
              </button>
            </div>

            <button
              type="button"
              onClick={handleStopAlarm}
              className="w-full py-2 bg-black/10 hover:bg-black/15 text-text rounded-xl text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <BellOff className="w-4 h-4 text-text-dim" />
              <span>Dismiss Alarm</span>
            </button>
          </div>
        ) : (
          /* Normal Controls */
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleStartPause}
              aria-label={isRunning || leadInStep !== null ? "Pause timer" : "Start timer"}
              className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
                isRunning || leadInStep !== null
                  ? "bg-accent/15 text-accent hover:bg-accent/25"
                  : "bg-black/5 hover:bg-black/10 text-black"
              }`}
            >
              {isRunning || leadInStep !== null ? (
                <Pause className="w-5 h-5 text-accent" />
              ) : (
                <Play className="w-5 h-5 text-black ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              aria-label="Reset timer"
              className="w-12 h-12 flex items-center justify-center bg-black/5 hover:bg-black/10 rounded-full transition-colors text-black"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleTestSound}
              aria-label="Test buzzer sound"
              className="w-12 h-12 flex items-center justify-center bg-black/5 hover:bg-black/10 rounded-full transition-colors text-black"
              title="Test Buzzer Audio"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        )}

        <p className="mt-3 text-[11px] text-text-dim text-center">
          {leadInStep !== null
            ? "Voice starting: 1... 2... 3... Start!"
            : isAlarming
            ? "🚨 Alarming! Tap Snooze for extra time or Dismiss to stop."
            : timeLeft <= 30 && timeLeft > 0 && isRunning
            ? "⚠️ 30 seconds left! Complete and release your arrows."
            : voiceLeadInEnabled && timeLeft === totalSeconds
            ? `Starting ${totalSeconds}s timer will speak '1, 2, 3, Start!' with 30s alert.`
            : isRunning
            ? `Counting down: ${timeLeft} sec remaining.`
            : "Tap Play to begin timer."}
        </p>
      </div>
    </Card>
  );
}

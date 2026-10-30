"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Card from "@/components/ui/Card";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Bell,
  AlarmClock,
  ShieldAlert,
  HelpCircle,
  X,
  VolumeX,
} from "lucide-react";

interface ArcheryTimerProps {
  resetCount: number;
}

type WakeLock = { release: () => Promise<void> };

type TimerMode = "wa" | "direct"; // "wa": Official World Archery 10s line prep; "direct": Instant start
type TimerPhase = "idle" | "prep" | "shooting" | "warning" | "ended" | "emergency" | "paused";

export default function ArcheryTimer({ resetCount }: ArcheryTimerProps) {
  // Configurable presets: 120s (3 arr indoor/match), 180s (3 arr standard), 240s (6 arr qualification)
  const [totalSeconds, setTotalSeconds] = useState(180);
  const [timeLeft, setTimeLeft] = useState(180);
  const [prepTimeLeft, setPrepTimeLeft] = useState(10);
  const [timerMode, setTimerMode] = useState<TimerMode>("wa");
  const [timerPhase, setTimerPhase] = useState<TimerPhase>("idle");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // References for timing, audio context, and screen lock
  const audioCtxRef = useRef<AudioContext | null>(null);
  const wakeLockRef = useRef<WakeLock | null>(null);
  const endsAtRef = useRef<number | null>(null);
  const prepEndsAtRef = useRef<number | null>(null);
  const lastTickRef = useRef(180);
  const hasSpoken30sRef = useRef(false);
  const hasSpoken10sRef = useRef(false);
  const phaseBeforePauseRef = useRef<TimerPhase>("shooting");

  // Get or initialize AudioContext
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

  // Web Speech API Voice synthesis helper
  const speak = useCallback(
    (text: string) => {
      if (!voiceEnabled) return;
      try {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.05;
          utterance.pitch = 1.05;
          utterance.volume = 1.0;
          window.speechSynthesis.speak(utterance);
        }
      } catch (err) {
        console.warn("SpeechSynthesis error:", err);
      }
    },
    [voiceEnabled]
  );

  // ---------------------------------------------------------------------------
  // TOURNAMENT WHISTLE SYNTHESIS (Fox 40 Classic Dual-Resonance Emulation)
  // ---------------------------------------------------------------------------
  // A competition whistle produces two harmonically interacting resonant peaks:
  // F1 ~2650 Hz, F2 ~2980 Hz, causing a ~330 Hz acoustic heterodyne trill.
  // We add an LFO at ~35 Hz and bandpass-filtered noise for realistic forced air.
  // ---------------------------------------------------------------------------
  const playSingleWhistle = useCallback(
    (ctx: AudioContext, startTime: number, duration: number, isEmergency = false) => {
      const f1 = isEmergency ? 2850 : 2650;
      const f2 = isEmergency ? 3200 : 2980;

      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);

      const t0 = startTime;
      const tEnd = t0 + duration;

      // Realistic sharp whistle attack and smooth decay
      masterGain.gain.setValueAtTime(0.0001, t0);
      masterGain.gain.linearRampToValueAtTime(0.65, t0 + 0.015);
      masterGain.gain.setValueAtTime(0.65, tEnd - 0.025);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, tEnd);

      // Turbulence LFO (vibrato/air pea rattle)
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(isEmergency ? 42 : 34, t0);
      lfoGain.gain.setValueAtTime(35, t0);
      lfo.connect(lfoGain);

      // Primary High Tone
      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(f1, t0);
      lfoGain.connect(osc1.frequency);
      osc1.connect(masterGain);

      // Secondary High Tone (creates acoustic beat frequency)
      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(f2, t0);
      lfoGain.connect(osc2.frequency);
      osc2.connect(masterGain);

      // Bandpass Breath Noise (authentic air rush)
      const bufferSize = Math.max(256, Math.floor(ctx.sampleRate * duration));
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime(f1, t0);
      bandpass.Q.setValueAtTime(3.5, t0);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.12, t0);

      whiteNoise.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(masterGain);

      // Start & Stop
      lfo.start(t0);
      osc1.start(t0);
      osc2.start(t0);
      whiteNoise.start(t0);

      lfo.stop(tEnd);
      osc1.stop(tEnd);
      osc2.stop(tEnd);
      whiteNoise.stop(tEnd);
    },
    []
  );

  /**
   * Play official World Archery whistle sequences:
   * 1 whistle: Commence shooting (duration ~0.42s)
   * 2 whistles: Look to line / approach (2x ~0.35s blasts)
   * 3 whistles: End of shooting / retrieve arrows (3x ~0.35s blasts)
   * 5 whistles: Emergency cease fire (5x rapid ~0.16s blasts)
   */
  const playWhistleSignal = useCallback(
    (signal: 1 | 2 | 3 | 5) => {
      if (!soundEnabled) return;
      const ctx = getAudioCtx();
      if (!ctx) return;

      const now = ctx.currentTime;

      if (signal === 1) {
        // 1 Whistle (Shoot)
        playSingleWhistle(ctx, now, 0.45);
      } else if (signal === 2) {
        // 2 Whistles (Line preparation)
        playSingleWhistle(ctx, now, 0.35);
        playSingleWhistle(ctx, now + 0.5, 0.35);
      } else if (signal === 3) {
        // 3 Whistles (Retrieve & score)
        playSingleWhistle(ctx, now, 0.35);
        playSingleWhistle(ctx, now + 0.48, 0.35);
        playSingleWhistle(ctx, now + 0.96, 0.4);
      } else if (signal === 5) {
        // 5 Rapid Whistles (Emergency cease fire)
        const blastLen = 0.16;
        const gap = 0.22;
        for (let i = 0; i < 5; i++) {
          playSingleWhistle(ctx, now + i * gap, blastLen, true);
        }
      }

      // Haptic vibration feedback for mobile devices
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        if (signal === 1) navigator.vibrate(250);
        else if (signal === 2) navigator.vibrate([200, 150, 200]);
        else if (signal === 3) navigator.vibrate([200, 150, 200, 150, 350]);
        else if (signal === 5) navigator.vibrate([150, 80, 150, 80, 150, 80, 150, 80, 300]);
      }
    },
    [getAudioCtx, playSingleWhistle, soundEnabled]
  );

  // Short warning beep at 30s
  const playWarningBeep = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, t); // A5 note
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.start(t);
    osc.stop(t + 0.25);
  }, [getAudioCtx, soundEnabled]);

  // Screen WakeLock management
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
      // Screen lock isn't supported or permission denied
    }
  }, []);

  // Reset timer on resetCount change
  useEffect(() => {
    setTimerPhase("idle");
    setTimeLeft(totalSeconds);
    setPrepTimeLeft(10);
    hasSpoken30sRef.current = false;
    hasSpoken10sRef.current = false;
    endsAtRef.current = null;
    prepEndsAtRef.current = null;
    lastTickRef.current = totalSeconds;
    releaseWakeLock();
  }, [resetCount, totalSeconds, releaseWakeLock]);

  // Screen wake lock re-acquire on visibility change
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && (timerPhase === "shooting" || timerPhase === "prep")) {
        void requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [timerPhase, requestWakeLock]);

  // ---------------------------------------------------------------------------
  // 10-SECOND LINE PREPARATION COUNTDOWN LOOP (World Archery Mode)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (timerPhase !== "prep") return;

    if (prepEndsAtRef.current === null) {
      prepEndsAtRef.current = Date.now() + prepTimeLeft * 1000;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round(((prepEndsAtRef.current ?? 0) - Date.now()) / 1000));
      setPrepTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        prepEndsAtRef.current = null;
        // 10s preparation complete -> Sound 1 WHISTLE and start shooting!
        playWhistleSignal(1);
        speak("Shoot!");
        setTimerPhase("shooting");
        endsAtRef.current = Date.now() + timeLeft * 1000;
        lastTickRef.current = timeLeft;
      }
    }, 250);

    return () => clearInterval(interval);
  }, [timerPhase, prepTimeLeft, timeLeft, playWhistleSignal, speak]);

  // ---------------------------------------------------------------------------
  // MAIN SHOOTING COUNTDOWN LOOP
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (timerPhase !== "shooting") return;

    if (endsAtRef.current === null) {
      endsAtRef.current = Date.now() + timeLeft * 1000;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round(((endsAtRef.current ?? 0) - Date.now()) / 1000));

      if (remaining !== lastTickRef.current) {
        // 30 seconds warning: Amber light switch + audio
        if (lastTickRef.current > 30 && remaining <= 30) {
          playWarningBeep();
          if (!hasSpoken30sRef.current) {
            hasSpoken30sRef.current = true;
            speak("30 seconds remaining");
          }
        }
        // 10 seconds warning
        else if (lastTickRef.current > 10 && remaining <= 10) {
          playWarningBeep();
          if (!hasSpoken10sRef.current) {
            hasSpoken10sRef.current = true;
            speak("10 seconds left");
          }
        }

        lastTickRef.current = remaining;
        setTimeLeft(remaining);

        // When time expires: 3 WHISTLES (World Archery Book 3 Ch 13)
        if (remaining === 0) {
          clearInterval(interval);
          endsAtRef.current = null;
          setTimerPhase("ended");
          playWhistleSignal(3);
          speak("Time is up. Retrieve arrows and score.");
          releaseWakeLock();
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [timerPhase, timeLeft, playWarningBeep, playWhistleSignal, speak, releaseWakeLock]);

  // ---------------------------------------------------------------------------
  // USER CONTROLS: START / PAUSE / RESUME / EMERGENCY
  // ---------------------------------------------------------------------------
  const handleStartPause = () => {
    getAudioCtx();

    if (timerPhase === "prep" || timerPhase === "shooting") {
      // Pause active timer
      phaseBeforePauseRef.current = timerPhase;
      endsAtRef.current = null;
      prepEndsAtRef.current = null;
      setTimerPhase("paused");
      releaseWakeLock();
    } else if (timerPhase === "paused") {
      // Resume from pause
      const targetPhase = phaseBeforePauseRef.current || "shooting";
      if (targetPhase === "prep") {
        prepEndsAtRef.current = Date.now() + prepTimeLeft * 1000;
        setTimerPhase("prep");
      } else {
        endsAtRef.current = Date.now() + timeLeft * 1000;
        setTimerPhase("shooting");
      }
      void requestWakeLock();
    } else {
      // Start fresh
      if (timeLeft === 0) return;
      void requestWakeLock();

      if (timerMode === "wa") {
        // WA Tournament Mode: 2 Whistles -> 10s line preparation -> 1 Whistle -> Shoot
        setTimerPhase("prep");
        setPrepTimeLeft(10);
        prepEndsAtRef.current = Date.now() + 10 * 1000;
        playWhistleSignal(2);
        speak("Look to the line. 10 seconds.");
      } else {
        // Quick Direct Mode: 1 Whistle -> Immediate shoot
        setTimerPhase("shooting");
        endsAtRef.current = Date.now() + timeLeft * 1000;
        lastTickRef.current = timeLeft;
        playWhistleSignal(1);
        speak("Shoot!");
      }
    }
  };

  const handleReset = () => {
    getAudioCtx();
    setTimerPhase("idle");
    setTimeLeft(totalSeconds);
    setPrepTimeLeft(10);
    hasSpoken30sRef.current = false;
    hasSpoken10sRef.current = false;
    endsAtRef.current = null;
    prepEndsAtRef.current = null;
    lastTickRef.current = totalSeconds;
    releaseWakeLock();
  };

  // Immediate Cease Fire / Emergency Stop (5 Rapid Whistles)
  const handleEmergencyStop = () => {
    getAudioCtx();
    endsAtRef.current = null;
    prepEndsAtRef.current = null;
    setTimerPhase("emergency");
    releaseWakeLock();
    playWhistleSignal(5);
    speak("Cease fire! Cease fire! All archers un-draw arrows.");
  };

  const handleClearEmergency = () => {
    getAudioCtx();
    setTimerPhase("paused");
  };

  const handleSelectDuration = (sec: number) => {
    getAudioCtx();
    setTimerPhase("idle");
    setTotalSeconds(sec);
    setTimeLeft(sec);
    setPrepTimeLeft(10);
    hasSpoken30sRef.current = false;
    hasSpoken10sRef.current = false;
    endsAtRef.current = null;
    prepEndsAtRef.current = null;
    lastTickRef.current = sec;
    releaseWakeLock();
  };

  // Snooze (+30s or +60s for practice)
  const handleSnooze = (seconds: number) => {
    getAudioCtx();
    hasSpoken30sRef.current = seconds <= 30;
    hasSpoken10sRef.current = false;
    setTimeLeft(seconds);
    lastTickRef.current = seconds;
    endsAtRef.current = Date.now() + seconds * 1000;
    setTimerPhase("shooting");
    void requestWakeLock();
    speak(`Resumed ${seconds} seconds extra practice.`);
  };

  // ---------------------------------------------------------------------------
  // TOURNAMENT TRAFFIC LIGHT DETERMINATION
  // ---------------------------------------------------------------------------
  // Red Light: Line prep (10s), Time Expired, Idle/Stopped, or Emergency
  // Amber Light: <= 30s remaining during shooting
  // Green Light: Active shooting (> 30s, or countdown running)
  // ---------------------------------------------------------------------------
  const isEmergency = timerPhase === "emergency";
  const isRedActive =
    timerPhase === "idle" ||
    timerPhase === "prep" ||
    timerPhase === "ended" ||
    timerPhase === "paused" ||
    isEmergency;
  const isAmberActive =
    (timerPhase === "shooting" || timerPhase === "paused") && timeLeft <= 30 && timeLeft > 0;
  const isGreenActive =
    timerPhase === "shooting" && timeLeft > 30;

  const progressPercentage = (timeLeft / totalSeconds) * 100;

  return (
    <Card className="overflow-hidden border border-slate-200/90 shadow-xs">
      <div
        className={`flex flex-col items-center justify-center p-3 transition-colors ${
          isEmergency
            ? "bg-rose-50/70"
            : timerPhase === "ended"
            ? "bg-amber-50/40"
            : timerPhase === "prep"
            ? "bg-red-50/40"
            : ""
        }`}
      >
        {/* Top Header Bar: Mode & Audio Controls */}
        <div className="w-full flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1.5">
            <AlarmClock className="w-4 h-4 text-accent" />
            <span className="text-[12px] font-bold text-slate-800 uppercase tracking-wider">
              End Timer
            </span>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-900 text-white tracking-widest">
              WA Official
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Rules Info Modal Trigger */}
            <button
              type="button"
              onClick={() => setShowRulesModal(true)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors cursor-pointer"
              title="Official World Archery Whistle Signal Rules"
              aria-label="Whistle rules guide"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => {
                getAudioCtx();
                setSoundEnabled(!soundEnabled);
              }}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                soundEnabled
                  ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                  : "text-slate-400 hover:text-slate-600 hover:bg-black/5"
              }`}
              title={soundEnabled ? "Tournament Whistles: ON" : "Tournament Whistles: MUTED"}
              aria-label="Toggle Whistle Sound"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Voice Toggle */}
            <button
              type="button"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                voiceEnabled
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "bg-slate-100 text-slate-400 border border-transparent"
              }`}
              title="Announce 'Look to the line', 'Shoot', '30s remaining'"
            >
              VOICE {voiceEnabled ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* WORLD ARCHERY TOURNAMENT TRAFFIC LIGHTS */}
        <div className="w-full bg-slate-950 rounded-xl p-2.5 mb-3.5 shadow-inner border border-slate-800">
          <div className="flex items-center justify-around gap-2 max-w-[280px] mx-auto">
            {/* RED LIGHT */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-9 h-9 rounded-full transition-all duration-300 flex items-center justify-center ${
                  isEmergency
                    ? "bg-rose-500 shadow-[0_0_16px_rgba(244,63,94,0.9)] animate-ping"
                    : isRedActive && !isAmberActive
                    ? "bg-rose-600 shadow-[0_0_18px_rgba(225,29,72,0.85)] ring-2 ring-rose-400 ring-offset-2 ring-offset-slate-950"
                    : "bg-rose-950/40 border border-rose-900/40 opacity-40"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full ${
                    isRedActive ? "bg-rose-200/80 blur-[0.5px]" : "bg-transparent"
                  }`}
                />
              </div>
              <span
                className={`text-[9px] font-black tracking-wider uppercase ${
                  isRedActive ? "text-rose-400" : "text-slate-600"
                }`}
              >
                STOP
              </span>
            </div>

            {/* AMBER / YELLOW LIGHT */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-9 h-9 rounded-full transition-all duration-300 flex items-center justify-center ${
                  isAmberActive
                    ? "bg-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.9)] ring-2 ring-amber-300 ring-offset-2 ring-offset-slate-950 animate-pulse"
                    : "bg-amber-950/40 border border-amber-900/40 opacity-40"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full ${
                    isAmberActive ? "bg-amber-100 blur-[0.5px]" : "bg-transparent"
                  }`}
                />
              </div>
              <span
                className={`text-[9px] font-black tracking-wider uppercase ${
                  isAmberActive ? "text-amber-300" : "text-slate-600"
                }`}
              >
                30 SEC
              </span>
            </div>

            {/* GREEN LIGHT */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-9 h-9 rounded-full transition-all duration-300 flex items-center justify-center ${
                  isGreenActive
                    ? "bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.9)] ring-2 ring-emerald-300 ring-offset-2 ring-offset-slate-950"
                    : "bg-emerald-950/40 border border-emerald-900/40 opacity-40"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full ${
                    isGreenActive ? "bg-emerald-200/90 blur-[0.5px]" : "bg-transparent"
                  }`}
                />
              </div>
              <span
                className={`text-[9px] font-black tracking-wider uppercase ${
                  isGreenActive ? "text-emerald-400" : "text-slate-600"
                }`}
              >
                SHOOT
              </span>
            </div>
          </div>

          {/* Current Official Phase Status Banner */}
          <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-center">
            {isEmergency ? (
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-400 animate-pulse flex items-center justify-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                🚨 EMERGENCY CEASE FIRE — UN-DRAW ARROWS
              </span>
            ) : timerPhase === "prep" ? (
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-400 animate-pulse">
                🔴 2 WHISTLES: LOOK TO THE LINE (10s PREP)
              </span>
            ) : timerPhase === "shooting" ? (
              timeLeft <= 30 ? (
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 animate-pulse">
                  🟡 30 SECONDS REMAINING!
                </span>
              ) : (
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                  🟢 1 WHISTLE: ACTIVE SHOOTING
                </span>
              )
            ) : timerPhase === "ended" ? (
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-400 animate-pulse">
                🔴 3 WHISTLES: RETRIEVE ARROWS & SCORE
              </span>
            ) : timerPhase === "paused" ? (
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                ⏸️ TIMING PAUSED
              </span>
            ) : (
              <span className="text-[10.5px] font-semibold text-slate-400">
                {timerMode === "wa"
                  ? "WA Official Mode: 2 Whistles (10s Prep) ➔ 1 Whistle (Shoot)"
                  : "Direct Mode: 1 Whistle (Shoot immediately)"}
              </span>
            )}
          </div>
        </div>

        {/* Mode Selector Tabs (WA Official vs Direct) & Preset Durations */}
        <div className="w-full flex flex-col gap-2 mb-3">
          {/* Mode Switcher */}
          <div className="flex items-center justify-center bg-slate-100 p-0.5 rounded-lg text-[10.5px] font-bold">
            <button
              type="button"
              onClick={() => {
                if (timerPhase === "idle" || timerPhase === "paused") setTimerMode("wa");
              }}
              className={`flex-1 py-1 rounded-md transition-all cursor-pointer ${
                timerMode === "wa"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Includes official 10-second line preparation period (2 whistles)"
            >
              WA Tournament (10s Prep)
            </button>
            <button
              type="button"
              onClick={() => {
                if (timerPhase === "idle" || timerPhase === "paused") setTimerMode("direct");
              }}
              className={`flex-1 py-1 rounded-md transition-all cursor-pointer ${
                timerMode === "direct"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Starts shooting immediately on 1 whistle"
            >
              Direct Shooting
            </button>
          </div>

          {/* Quick End Presets */}
          <div className="flex items-center justify-center gap-1.5 bg-slate-100/90 p-1 rounded-xl">
            {[
              { label: "120s (3 Arr)", value: 120, desc: "Indoor / Match" },
              { label: "180s (3 Arr)", value: 180, desc: "Standard Practice" },
              { label: "240s (6 Arr)", value: 240, desc: "WA 70m/50m" },
            ].map((preset) => (
              <button
                key={preset.value}
                type="button"
                disabled={timerPhase === "prep" || timerPhase === "shooting"}
                onClick={() => handleSelectDuration(preset.value)}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                  totalSeconds === preset.value
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                    : "text-slate-500 hover:text-slate-900 disabled:opacity-50"
                }`}
                title={preset.desc}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Circular Display & Countdown Counter */}
        <div className="relative w-36 h-36 flex items-center justify-center mb-3">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="72"
              cy="72"
              r="66"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="7"
              className="text-black/5"
            />
            {timerPhase === "prep" ? (
              // Prep circular progress
              <circle
                cx="72"
                cy="72"
                r="66"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="7"
                strokeDasharray={414}
                strokeDashoffset={414 - (414 * ((10 - prepTimeLeft) / 10))}
                className="text-rose-500 transition-all duration-300 ease-linear"
              />
            ) : (
              // Main shooting circular progress
              <circle
                cx="72"
                cy="72"
                r="66"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="7"
                strokeDasharray={414}
                strokeDashoffset={414 - (414 * progressPercentage) / 100}
                className={`transition-all duration-300 ease-linear ${
                  timeLeft <= 10
                    ? "text-rose-600"
                    : timeLeft <= 30
                    ? "text-amber-500"
                    : "text-emerald-500"
                }`}
              />
            )}
          </svg>

          {/* Central Counter Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1">
            {timerPhase === "prep" ? (
              <div className="animate-pulse">
                <span className="text-4xl font-mono font-black text-rose-600 leading-none">
                  {prepTimeLeft}
                </span>
                <span className="block text-[9px] uppercase font-black tracking-widest text-rose-500 mt-1">
                  LINE PREP
                </span>
                <span className="text-[8px] font-bold text-slate-400">2 WHISTLES</span>
              </div>
            ) : isEmergency ? (
              <div>
                <span className="text-3xl font-mono font-black text-rose-600 leading-none">
                  STOP
                </span>
                <span className="block text-[9px] uppercase font-black tracking-widest text-rose-600 mt-1 animate-pulse">
                  5 WHISTLES
                </span>
              </div>
            ) : timerPhase === "ended" ? (
              <div>
                <div className="flex items-baseline justify-center gap-0.5">
                  <span className="text-4xl font-mono font-black text-rose-600">0</span>
                  <span className="text-xs font-bold uppercase text-rose-600">sec</span>
                </div>
                <span className="block text-[9px] font-black text-rose-600 uppercase tracking-widest animate-pulse mt-0.5">
                  3 WHISTLES
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-baseline justify-center gap-0.5">
                  <span
                    className={`text-4xl font-mono font-black tracking-tight transition-colors ${
                      timeLeft <= 10
                        ? "text-rose-600"
                        : timeLeft <= 30
                        ? "text-amber-600"
                        : "text-slate-900"
                    }`}
                  >
                    {timeLeft}
                  </span>
                  <span
                    className={`text-xs font-bold uppercase ${
                      timeLeft <= 10
                        ? "text-rose-600"
                        : timeLeft <= 30
                        ? "text-amber-600"
                        : "text-slate-400"
                    }`}
                  >
                    sec
                  </span>
                </div>

                {timerPhase === "shooting" && (
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${
                      timeLeft <= 10
                        ? "bg-rose-100 text-rose-700 animate-pulse"
                        : timeLeft <= 30
                        ? "bg-amber-100 text-amber-800 animate-pulse"
                        : "bg-emerald-50 text-emerald-700 font-extrabold"
                    }`}
                  >
                    {timeLeft <= 10 ? "10s ALERT!" : timeLeft <= 30 ? "30s WARNING" : "SHOOTING"}
                  </span>
                )}

                {timerPhase === "paused" && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-1">
                    PAUSED
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Emergency Stop / Cease Fire Button (World Archery Rule 13.1.3: 5+ Whistles) */}
        {isEmergency ? (
          <div className="w-full max-w-[280px] flex flex-col gap-2 mb-2 animate-fadeIn">
            <button
              type="button"
              onClick={handleClearEmergency}
              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[12px] font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Resume / Clear Emergency</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="w-full py-1.5 text-slate-500 hover:text-slate-800 text-[11px] font-medium"
            >
              Reset to Start
            </button>
          </div>
        ) : timerPhase === "ended" ? (
          /* Time Expired / Retrieve Arrows Controls */
          <div className="w-full max-w-[280px] flex flex-col gap-2 mb-2 animate-fadeIn">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSnooze(30)}
                className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[12px] font-bold shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span>Practice (+30s)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSnooze(60)}
                className="py-2.5 px-3 bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 rounded-xl text-[12px] font-bold transition-colors cursor-pointer"
                title="Extra 60 seconds practice"
              >
                +60s
              </button>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Next End (Reset)</span>
            </button>
          </div>
        ) : (
          /* Normal Controls */
          <div className="w-full max-w-[290px] flex flex-col items-center gap-3">
            <div className="flex items-center justify-center gap-3 w-full">
              {/* Play / Pause */}
              <button
                type="button"
                onClick={handleStartPause}
                aria-label={
                  timerPhase === "prep" || timerPhase === "shooting" ? "Pause timer" : "Start timer"
                }
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-[12px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                  timerPhase === "prep" || timerPhase === "shooting"
                    ? "bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20"
                }`}
              >
                {timerPhase === "prep" || timerPhase === "shooting" ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                    <span>
                      {timerPhase === "paused"
                        ? "Resume"
                        : timerMode === "wa"
                        ? "Start WA End"
                        : "Start Shooting"}
                    </span>
                  </>
                )}
              </button>

              {/* Reset */}
              <button
                type="button"
                onClick={handleReset}
                aria-label="Reset timer"
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Whistle Test sound button */}
              <button
                type="button"
                onClick={() => playWhistleSignal(1)}
                aria-label="Test whistle blast"
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Test Competition Whistle (1 blast)"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Prominent Emergency Cease Fire Button */}
            {(timerPhase === "shooting" || timerPhase === "prep" || timerPhase === "paused") && (
              <button
                type="button"
                onClick={handleEmergencyStop}
                className="w-full py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300/80 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Immediately stop shooting and sound 5 emergency whistle blasts"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>🚨 Emergency Cease Fire (5 Whistles)</span>
              </button>
            )}
          </div>
        )}

        {/* Footer Hint */}
        <p className="mt-3 text-[10.5px] text-slate-400 text-center leading-relaxed">
          {timerPhase === "prep"
            ? "🔴 2 Whistles: Step to the shooting line. 10s preparation in progress."
            : timerPhase === "shooting"
            ? timeLeft <= 30
              ? "🟡 30 seconds left: Complete and release remaining arrows."
              : "🟢 1 Whistle: Clear to shoot. Timing active."
            : timerPhase === "ended"
            ? "🔴 3 Whistles: Shooting closed. Advance to targets to score and retrieve."
            : isEmergency
            ? "🚨 Cease Fire: All archers must un-draw and step behind the waiting line."
            : timerMode === "wa"
            ? "Tap Start to trigger official 2 whistles and 10s line preparation."
            : "Tap Start to sound 1 whistle and commence countdown."}
        </p>

        {/* Official World Archery Whistle Signals Modal */}
        {showRulesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 relative">
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  WA
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    World Archery Whistle Codes
                  </h3>
                  <p className="text-[10px] text-slate-500">Official Rulebook Book 3, Chapter 13</p>
                </div>
              </div>

              <div className="space-y-2.5 text-[11.5px] text-slate-700 my-4">
                <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200/60 flex items-start gap-2.5">
                  <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono font-bold text-[10px] shrink-0">
                    2 Whistles
                  </span>
                  <div>
                    <span className="font-bold text-rose-900 block">Look to the Line (Red)</span>
                    <span className="text-rose-700 text-[10.5px]">
                      Athletes may step onto the shooting line with their equipment. 10-second preparation period.
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/60 flex items-start gap-2.5">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-mono font-bold text-[10px] shrink-0">
                    1 Whistle
                  </span>
                  <div>
                    <span className="font-bold text-emerald-900 block">Commence Shooting (Green)</span>
                    <span className="text-emerald-700 text-[10.5px]">
                      Shooting begins. Digital timer counts down (120s / 180s / 240s).
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60 flex items-start gap-2.5">
                  <span className="px-1.5 py-0.5 rounded bg-amber-600 text-white font-mono font-bold text-[10px] shrink-0">
                    Amber Light
                  </span>
                  <div>
                    <span className="font-bold text-amber-900 block">30 Seconds Remaining</span>
                    <span className="text-amber-700 text-[10.5px]">
                      Warning amber light turns on and warning tone alerts archers.
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200/60 flex items-start gap-2.5">
                  <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono font-bold text-[10px] shrink-0">
                    3 Whistles
                  </span>
                  <div>
                    <span className="font-bold text-rose-900 block">Retrieve & Score (Red)</span>
                    <span className="text-rose-700 text-[10.5px]">
                      Shooting time expired. Athletes advance to target to score and retrieve arrows.
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 text-white flex items-start gap-2.5">
                  <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-mono font-bold text-[10px] shrink-0">
                    5+ Whistles
                  </span>
                  <div>
                    <span className="font-bold text-rose-400 block">Emergency Cease Fire</span>
                    <span className="text-slate-300 text-[10.5px]">
                      Immediate stop! Un-draw arrows, return arrow to quiver, and step behind waiting line immediately.
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => playWhistleSignal(2)}
                  className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  🔊 Test 2 Whistles
                </button>
                <button
                  type="button"
                  onClick={() => playWhistleSignal(3)}
                  className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  🔊 Test 3 Whistles
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="mt-3 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[12px] font-bold cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

"use client";

import React, { useState } from "react";
import { Mic, Volume2, VolumeX, Sparkles, AlertCircle } from "lucide-react";

interface VoiceScoringWidgetProps {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  lastDetected: string | null;
  error: string | null;
  toggleListening: () => void;
  voiceFeedbackEnabled: boolean;
  setVoiceFeedbackEnabled: (enabled: boolean) => void;
}

export default function VoiceScoringWidget({
  isListening,
  isSupported,
  transcript,
  lastDetected,
  error,
  toggleListening,
  voiceFeedbackEnabled,
  setVoiceFeedbackEnabled,
}: VoiceScoringWidgetProps) {
  const [showTips, setShowTips] = useState(false);

  if (!isSupported) {
    return null; // Gracefully hidden if browser doesn't support Web Speech API
  }

  return (
    <div className={`rounded-xl border transition-all ${
      isListening 
        ? "bg-gradient-to-r from-red-50 via-rose-50 to-amber-50 border-accent/40 shadow-sm p-3" 
        : "bg-slate-50/80 border-slate-200/80 p-2.5"
    }`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Left: Mic Activation Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleListening}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
              isListening
                ? "bg-accent text-white ring-4 ring-accent/20 animate-pulse"
                : "bg-white text-slate-800 border border-slate-200 hover:border-accent hover:text-accent"
            }`}
            title={isListening ? "Stop voice listening" : "Start speaking arrow scores"}
          >
            {isListening ? (
              <>
                <Mic className="w-4 h-4 animate-bounce" />
                <span>Listening...</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-accent" />
                <span>Speak to Score</span>
              </>
            )}
          </button>

          {/* Sound waves when active */}
          {isListening && (
            <div className="flex items-center gap-0.5 h-4">
              <span className="w-1 h-2 bg-accent rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
              <span className="w-1 h-3.5 bg-accent rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.1s]" />
              <span className="w-1 h-2.5 bg-accent rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.2s]" />
              <span className="w-1 h-4 bg-accent rounded-full animate-[pulse_0.9s_ease-in-out_infinite_0.15s]" />
            </div>
          )}

          {/* Status Label or Last Detected */}
          <div className="text-[11px] font-medium text-slate-600 truncate max-w-[200px] sm:max-w-xs">
            {isListening ? (
              lastDetected ? (
                <span className="flex items-center gap-1 text-slate-900 font-bold">
                  <Sparkles className="w-3 h-3 text-amber-500 flex-shrink-0" />
                  <span className="text-accent">Logged:</span> {lastDetected}
                </span>
              ) : (
                <span className="text-slate-500 italic">Say &quot;Ten&quot;, &quot;Nine&quot;, &quot;X&quot;...</span>
              )
            ) : (
              <span className="text-slate-500">Hands-free voice scoring</span>
            )}
          </div>
        </div>

        {/* Right: Audio Feedback Toggle & Tips */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => setVoiceFeedbackEnabled(!voiceFeedbackEnabled)}
            className={`p-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              voiceFeedbackEnabled
                ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                : "bg-slate-200/70 text-slate-400 border-slate-300"
            }`}
            title={voiceFeedbackEnabled ? "Spoken voice feedback is ON" : "Voice feedback is MUTED"}
          >
            {voiceFeedbackEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-accent" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowTips(!showTips)}
            className="text-[10.5px] font-semibold text-slate-500 hover:text-accent underline cursor-pointer px-1"
          >
            {showTips ? "Hide tips" : "Voice tips"}
          </button>
        </div>
      </div>

      {/* Spoken transcript live preview */}
      {isListening && transcript && (
        <div className="mt-2 pt-2 border-t border-accent/20 flex items-center justify-between text-[11px] text-slate-700">
          <span className="truncate">
            <span className="font-semibold text-slate-500">Heard:</span> &quot;{transcript}&quot;
          </span>
        </div>
      )}

      {/* Error message if permission was denied */}
      {error && (
        <div className="mt-2 p-2 rounded-lg bg-red-100/90 border border-red-200 text-red-800 text-[11px] font-medium flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Voice commands guide */}
      {showTips && (
        <div className="mt-2.5 pt-2 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px]">
          <div className="p-1.5 rounded bg-white border border-slate-200/80">
            <span className="font-bold text-slate-800 block">Single Arrow</span>
            <span className="text-slate-500">&quot;Ten&quot;, &quot;X&quot;, &quot;Nine&quot;, &quot;Eight&quot;</span>
          </div>
          <div className="p-1.5 rounded bg-white border border-slate-200/80">
            <span className="font-bold text-slate-800 block">Full End (6 arrows)</span>
            <span className="text-slate-500">&quot;10, 10, 9, 8, 8, 7&quot;</span>
          </div>
          <div className="p-1.5 rounded bg-white border border-slate-200/80">
            <span className="font-bold text-slate-800 block">Undo Arrow</span>
            <span className="text-slate-500">Say &quot;Undo&quot; or &quot;Delete&quot;</span>
          </div>
          <div className="p-1.5 rounded bg-white border border-slate-200/80">
            <span className="font-bold text-slate-800 block">Next End</span>
            <span className="text-slate-500">Say &quot;Submit end&quot;</span>
          </div>
        </div>
      )}
    </div>
  );
}

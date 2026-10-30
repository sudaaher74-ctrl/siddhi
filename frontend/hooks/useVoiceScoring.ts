"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ScoreValue } from "@/components/ScoreEntryContainer";

interface UseVoiceScoringProps {
  onScoreInput: (score: ScoreValue, cx?: number | null, cy?: number | null) => void;
  onUndo: () => void;
  onSubmitEnd: () => void;
  currentArrowsCount: number;
  isSessionComplete: boolean;
  bowType?: string;
  voiceFeedbackEnabled?: boolean;
}

export function useVoiceScoring({
  onScoreInput,
  onUndo,
  onSubmitEnd,
  currentArrowsCount,
  isSessionComplete,
  bowType = "Recurve Bow",
  voiceFeedbackEnabled = true,
}: UseVoiceScoringProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [lastDetected, setLastDetected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const currentArrowsCountRef = useRef(currentArrowsCount);
  currentArrowsCountRef.current = currentArrowsCount;

  const isSessionCompleteRef = useRef(isSessionComplete);
  isSessionCompleteRef.current = isSessionComplete;

  const isCompound = bowType?.toLowerCase().includes("compound") ?? false;

  // Audio feedback using SpeechSynthesis
  const speakFeedback = useCallback((text: string) => {
    if (!voiceFeedbackEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1.05;
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }, [voiceFeedbackEnabled]);

  /**
   * Parses spoken words into Archery Score Values or Commands
   */
  const parseArcheryWord = useCallback((word: string): { type: "score"; value: ScoreValue } | { type: "command"; action: "undo" | "submit" } | null => {
    const clean = word.toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    if (!clean) return null;

    // Commands
    if (["undo", "delete", "remove", "back"].includes(clean)) {
      return { type: "command", action: "undo" };
    }
    if (["submit", "next", "submit end", "next end", "finish", "done"].includes(clean)) {
      return { type: "command", action: "submit" };
    }

    // X Ring
    if (["x", "ex", "axe", "cross", "inner 10", "inner ten"].includes(clean)) {
      return { type: "score", value: "X" };
    }

    // 10
    if (["ten", "10", "tin", "den"].includes(clean)) {
      return { type: "score", value: "10" };
    }

    // 9
    if (["nine", "9", "nein"].includes(clean)) {
      return { type: "score", value: "9" };
    }

    // 8
    if (["eight", "8", "ate"].includes(clean)) {
      return { type: "score", value: "8" };
    }

    // 7
    if (["seven", "7"].includes(clean)) {
      return { type: "score", value: "7" };
    }

    // 6
    if (["six", "6"].includes(clean)) {
      return { type: "score", value: "6" };
    }

    // 5
    if (["five", "5"].includes(clean)) {
      return { type: "score", value: "5" };
    }

    // 4 (Recurve / Indian only)
    if (["four", "4", "for", "fore"].includes(clean)) {
      return { type: "score", value: isCompound ? "M" : "4" };
    }

    // 3 (Recurve / Indian only)
    if (["three", "3", "tree"].includes(clean)) {
      return { type: "score", value: isCompound ? "M" : "3" };
    }

    // 2 (Recurve / Indian only)
    if (["two", "2", "to", "too"].includes(clean)) {
      return { type: "score", value: isCompound ? "M" : "2" };
    }

    // 1 (Recurve / Indian only)
    if (["one", "1", "won"].includes(clean)) {
      return { type: "score", value: isCompound ? "M" : "1" };
    }

    // Miss
    if (["miss", "missed", "zero", "0", "m", "blank", "out"].includes(clean)) {
      return { type: "score", value: "M" };
    }

    return null;
  }, [isCompound]);

  /**
   * Processes full speech transcripts, parsing multiple arrow callouts
   * e.g. "Ten, ten, nine, eight, eight, seven"
   */
  const processTranscript = useCallback((rawTranscript: string) => {
    setTranscript(rawTranscript);
    if (isSessionCompleteRef.current) return;

    // Check for explicit commands first
    const lower = rawTranscript.toLowerCase().trim();
    if (lower.includes("undo") || lower.includes("delete last")) {
      setLastDetected("Undo");
      speakFeedback("Undone");
      onUndo();
      return;
    }

    if (lower.includes("submit") || lower.includes("next end")) {
      if (currentArrowsCountRef.current === 6) {
        setLastDetected("Submit End");
        speakFeedback("End submitted");
        onSubmitEnd();
      } else {
        speakFeedback(`Need ${6 - currentArrowsCountRef.current} more arrows`);
      }
      return;
    }

    // Split into tokens (handling commas, hyphens, and spaces)
    const tokens = rawTranscript
      .replace(/[,]+/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    const detectedScores: ScoreValue[] = [];

    // Parse phrase combinations like "inner ten"
    for (let i = 0; i < tokens.length; i++) {
      const single = parseArcheryWord(tokens[i]);
      if (single && single.type === "score") {
        detectedScores.push(single.value);
      } else if (i + 1 < tokens.length) {
        const doubleWord = `${tokens[i]} ${tokens[i + 1]}`;
        const doubleMatch = parseArcheryWord(doubleWord);
        if (doubleMatch && doubleMatch.type === "score") {
          detectedScores.push(doubleMatch.value);
          i++; // skip next token
        }
      }
    }

    if (detectedScores.length > 0) {
      // Calculate how many arrows can still fit in this end
      const availableSlots = 6 - currentArrowsCountRef.current;
      const scoresToAdd = detectedScores.slice(0, availableSlots);

      if (scoresToAdd.length > 0) {
        setLastDetected(scoresToAdd.join(", "));
        
        // Add scores sequentially
        scoresToAdd.forEach((score, idx) => {
          setTimeout(() => {
            if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(12);
            onScoreInput(score, null, null);
          }, idx * 60);
        });

        // Speak feedback
        const spoken = scoresToAdd.map(s => s === "X" ? "X" : s === "M" ? "Miss" : s).join(", ");
        speakFeedback(spoken);

        if (currentArrowsCountRef.current + scoresToAdd.length >= 6) {
          setTimeout(() => {
            speakFeedback("End complete. Say submit to continue.");
          }, scoresToAdd.length * 60 + 600);
        }
      }
    }
  }, [parseArcheryWord, onScoreInput, onUndo, onSubmitEnd, speakFeedback]);

  // Initialize SpeechRecognition
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript.trim()) {
          processTranscript(finalTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setError("Microphone permission denied. Enable microphone access in browser settings.");
          setIsListening(false);
          isListeningRef.current = false;
        } else if (event.error !== "no-speech") {
          setError(`Voice input error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        // Auto-restart if user still wants to listen
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
            isListeningRef.current = false;
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.error("Failed to initialize speech recognition", e);
      setIsSupported(false);
    }

    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [processTranscript]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    setTranscript("");
    isListeningRef.current = true;
    try {
      recognitionRef.current.start();
      speakFeedback("Listening");
    } catch {
      // If already started, ignore error
    }
  }, [speakFeedback]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    transcript,
    lastDetected,
    error,
    startListening,
    stopListening,
    toggleListening,
  };
}


import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function TimerScreen() {
  const [seconds, setSeconds] = useState(120); // Default 2 minutes
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && !isPaused && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (seconds === 0) {
      clearInterval(intervalRef.current!);
      setIsActive(false);
      // Play a sound or vibrate here in a real app
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isPaused, seconds]);

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsPaused(false);
    setSeconds(120);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Practice Timer</ThemedText>
        
        <ThemedView style={styles.timerDisplay}>
          <ThemedText style={styles.timeText}>{formatTime(seconds)}</ThemedText>
        </ThemedView>

        <View style={styles.controls}>
          {!isActive || isPaused ? (
            <TouchableOpacity style={[styles.button, styles.startButton]} onPress={handleStart}>
              <ThemedText style={styles.buttonText}>Start</ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.button, styles.pauseButton]} onPress={handlePause}>
              <ThemedText style={styles.buttonText}>Pause</ThemedText>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={handleReset}>
            <ThemedText style={styles.buttonText}>Reset</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.presets}>
          <ThemedText style={styles.presetsTitle}>Presets</ThemedText>
          <View style={styles.presetButtons}>
            <TouchableOpacity style={styles.presetButton} onPress={() => { handleReset(); setSeconds(120); }}>
              <ThemedText style={styles.presetText}>2 Min</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetButton} onPress={() => { handleReset(); setSeconds(240); }}>
              <ThemedText style={styles.presetText}>4 Min</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetButton} onPress={() => { handleReset(); setSeconds(300); }}>
              <ThemedText style={styles.presetText}>5 Min</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: 40,
  },
  timerDisplay: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 8,
    borderColor: '#0a7ea4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
    backgroundColor: '#f8f9fa',
  },
  timeText: {
    fontSize: 64,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    color: '#333',
  },
  controls: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 40,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    minWidth: 140,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#0a7ea4',
  },
  pauseButton: {
    backgroundColor: '#ffc107',
  },
  resetButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  presets: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  presetsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#666',
  },
  presetButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  presetButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
  },
  presetText: {
    color: '#495057',
    fontWeight: '500',
  },
});

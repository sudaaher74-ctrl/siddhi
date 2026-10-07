import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetch } from '@/services/api';

export default function ScoreScreen() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [type, setType] = useState('Practice');
  const [arrows, setArrows] = useState('');
  const [score, setScore] = useState('');
  const [tens, setTens] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name || !arrows || !score || !tens) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Arrows, Score, Tens).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name,
        type,
        arrows: parseInt(arrows, 10),
        score: parseInt(score, 10),
        avg: parseFloat((parseInt(score, 10) / parseInt(arrows, 10)).toFixed(2)),
        tens: parseInt(tens, 10),
        note,
      };

      await apiFetch('/sessions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      Alert.alert('Success', 'Session logged successfully!', [
        { text: 'OK', onPress: () => {
          // Reset form
          setName('');
          setType('Practice');
          setArrows('');
          setScore('');
          setTens('');
          setNote('');
          
          // Navigate back to Dashboard
          router.push('/(tabs)');
        }}
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to log session');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <ThemedText type="title" style={styles.title}>Log Session</ThemedText>
        
        <ThemedView style={styles.formContainer}>
          <ThemedText style={styles.label}>Session Name</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="e.g. Morning Practice"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />

          <ThemedText style={styles.label}>Session Type</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Practice / Competition"
            placeholderTextColor="#999"
            value={type}
            onChangeText={setType}
          />

          <ThemedText style={styles.label}>Total Arrows</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="e.g. 72"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={arrows}
            onChangeText={setArrows}
          />

          <ThemedText style={styles.label}>Total Score</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="e.g. 650"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={score}
            onChangeText={setScore}
          />

          <ThemedText style={styles.label}>10s and Xs</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="e.g. 15"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={tens}
            onChangeText={setTens}
          />

          <ThemedText style={styles.label}>Notes (Optional)</ThemedText>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="How did you feel?"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            value={note}
            onChangeText={setNote}
          />

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Save Session</ThemedText>
            )}
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 10,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#0a7ea4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

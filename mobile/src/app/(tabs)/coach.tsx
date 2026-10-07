import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetch } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function CoachScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'coach'; text: string }[]>([
    { id: '1', role: 'coach', text: `Hi ${user?.name || 'there'}! I'm your AI Archery Coach. How can I help you improve your form today?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { id: Date.now().toString(), role: 'user' as const, text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Here we would call the actual AI Coach backend endpoint
      // const response = await apiFetch('/ai/chat', { method: 'POST', body: JSON.stringify({ message: userMessage.text }) });
      
      // Simulating API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const coachMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'coach' as const, 
        text: "That's a great question. Remember to focus on your back tension and follow-through. Keep your bow arm steady until the arrow hits the target." 
      };
      setMessages(prev => [...prev, coachMessage]);
    } catch (error) {
      console.error('Failed to get coach response:', error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>AI Coach</ThemedText>
      </ThemedView>

      <ScrollView 
        style={styles.chatArea} 
        contentContainerStyle={styles.chatContent}
        ref={scrollViewRef}
      >
        {messages.map((msg) => (
          <View key={msg.id} style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.coachBubble]}>
            <ThemedText style={[styles.messageText, msg.role === 'user' ? styles.userText : styles.coachText]}>
              {msg.text}
            </ThemedText>
          </View>
        ))}
        {isTyping && (
          <View style={[styles.messageBubble, styles.coachBubble, styles.typingBubble]}>
            <ActivityIndicator size="small" color="#0a7ea4" />
          </View>
        )}
      </ScrollView>

      <ThemedView style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Ask for advice..."
          placeholderTextColor="#999"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={!input.trim() || isTyping}>
          <ThemedText style={styles.sendButtonText}>Send</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 20,
    gap: 15,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 15,
    borderRadius: 20,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0a7ea4',
    borderBottomRightRadius: 5,
  },
  coachBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#e9ecef',
    borderBottomLeftRadius: 5,
  },
  typingBubble: {
    padding: 10,
    width: 60,
    alignItems: 'center',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  coachText: {
    color: '#333',
  },
  inputArea: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

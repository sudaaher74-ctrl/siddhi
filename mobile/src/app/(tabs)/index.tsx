import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ArrowPlot from '@/components/ArrowPlot';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/services/api';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const data = await apiFetch('/sessions');
        setSessions(data);
      } catch (error) {
        console.error('Failed to load sessions', error);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  const renderSession = ({ item }: { item: any }) => (
    <ThemedView style={styles.sessionCard}>
      <ThemedText style={styles.sessionDate}>
        {new Date(item.date || item.createdAt).toLocaleDateString()}
      </ThemedText>
      <ThemedText style={styles.sessionDetails}>
        Type: {item.type} | Arrows: {item.arrows || 0} | Score: {item.score || 0}
      </ThemedText>
      {item.note ? (
        <ThemedText style={styles.sessionNotes}>{item.note}</ThemedText>
      ) : null}
    </ThemedView>
  );

  const renderHeader = () => (
    <>
      {sessions.length > 0 && (
        <ArrowPlot sessions={sessions} bowType={sessions[0]?.bow || 'Recurve'} />
      )}
      <ThemedText type="subtitle" style={styles.sectionTitle}>Recent Sessions</ThemedText>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Hello, {user?.name}</ThemedText>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <ThemedText style={styles.logoutText}>Logout</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#0a7ea4" style={styles.loader} />
        ) : sessions.length === 0 ? (
          <ThemedText style={styles.emptyText}>No sessions recorded yet.</ThemedText>
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id || item._id}
            renderItem={renderSession}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  logoutText: {
    color: '#d32f2f',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 15,
  },
  loader: {
    marginTop: 40,
  },
  listContainer: {
    paddingBottom: 20,
  },
  sessionCard: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  sessionDetails: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 5,
  },
  sessionNotes: {
    fontSize: 14,
    color: '#495057',
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#6c757d',
  },
});

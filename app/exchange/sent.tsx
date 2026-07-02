import { getMySentReplies, initExchange, SentReply } from '@/utils/exchange-api';
import { Events, posthog } from '@/utils/posthog';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SentScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notes, setNotes] = useState<SentReply[]>([]);

  const load = useCallback(async () => {
    await initExchange();
    setNotes(await getMySentReplies());
  }, []);

  useEffect(() => {
    posthog.capture(Events.EXCHANGE_SENT_OPENED);
    (async () => {
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={12} onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#5A8BA8" />
        </Pressable>
        <Text style={styles.title}>Notes you&apos;ve sent</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#5A8BA8" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 24 },
            notes.length === 0 && styles.scrollEmpty,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5A8BA8" />
          }
        >
          {notes.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nothing yet</Text>
              <Text style={styles.emptyBody}>
                The comfort you write to strangers shows up here for a day. A heart means
                someone felt it.
              </Text>
            </View>
          ) : (
            notes.map((n) => (
              <View key={n.id} style={styles.card}>
                <Text style={styles.cardText}>{n.text}</Text>
                {n.liked && (
                  <View style={styles.likedRow}>
                    <Ionicons name="heart" size={16} color="#E8869B" />
                    <Text style={styles.likedText}>Someone felt this</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: '700', color: '#5A8BA8', letterSpacing: 0.3 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 24, paddingTop: 8 },
  scrollEmpty: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#5A8BA8' },
  emptyBody: {
    fontSize: 15,
    lineHeight: 23,
    color: '#6B8F9E',
    textAlign: 'center',
    marginTop: 10,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 22,
    marginBottom: 16,
    shadowColor: '#5A8BA8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
  },
  cardText: { fontSize: 17, lineHeight: 26, color: '#4E6B7A', fontWeight: '400' },
  likedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  likedText: { fontSize: 13, color: '#E8869B', fontWeight: '600' },
});

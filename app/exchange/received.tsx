import { NoteCard } from '@/components/exchange/note-card';
import { MAX_REPLIES_PER_DAY } from '@/constants/exchange';
import { exchangePrompt } from '@/data/exchange-prompts';
import {
  blockReplyAuthor,
  getMyReplies,
  initExchange,
  likeReply,
  ReceivedReply,
  reportTarget,
} from '@/utils/exchange-api';
import { getRepliesSentToday, markReceivedSeen } from '@/utils/exchange-state';
import { fadesInLabel } from '@/utils/exchange-time';
import { Events, posthog } from '@/utils/posthog';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

export default function ReceivedScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replies, setReplies] = useState<ReceivedReply[]>([]);
  const [sentToday, setSentToday] = useState(0);

  const load = useCallback(async () => {
    await initExchange();
    const [data, count] = await Promise.all([getMyReplies(), getRepliesSentToday()]);
    setSentToday(count);
    setReplies(data);
    // Opening the inbox marks everything current as read → clears the deck badge.
    await markReceivedSeen();
    if (data.length > 0) {
      posthog.capture(Events.EXCHANGE_REPLY_RECEIVED, { count: data.length });
    }
  }, []);

  useEffect(() => {
    posthog.capture(Events.EXCHANGE_REPLY_OPENED);
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

  const handleReport = useCallback((id: string, text: string) => {
    // Optimistic: hide immediately, fire-and-forget the report (with a text
    // snapshot so it survives the note's expiry).
    setReplies((prev) => prev.filter((r) => r.id !== id));
    posthog.capture(Events.EXCHANGE_REPORTED);
    reportTarget('reply', id, text).catch(() => {});
  }, []);

  const handleBlock = useCallback((id: string) => {
    // Hide, then block the sender server-side so they never route to us again.
    setReplies((prev) => prev.filter((r) => r.id !== id));
    posthog.capture(Events.EXCHANGE_BLOCKED);
    blockReplyAuthor(id).catch(() => {});
  }, []);

  const handleLike = useCallback((id: string) => {
    posthog.capture(Events.EXCHANGE_LIKED);
    likeReply(id).catch(() => {});
  }, []);

  // Group replies under the note they answer, so each reply has context.
  const groups = useMemo(() => {
    const map = new Map<string, { postText: string; postMood: ReceivedReply['post_mood']; items: ReceivedReply[] }>();
    for (const r of replies) {
      const g = map.get(r.post_id);
      if (g) g.items.push(r);
      else map.set(r.post_id, { postText: r.post_text, postMood: r.post_mood, items: [r] });
    }
    return Array.from(map, ([post_id, g]) => ({ post_id, ...g }));
  }, [replies]);

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
        <Text style={styles.title}>Notes for you</Text>
        <Pressable hitSlop={12} onPress={() => router.push('/exchange/sent')} style={styles.sentLink}>
          <Text style={styles.sentLinkText}>Sent</Text>
        </Pressable>
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
            replies.length === 0 && styles.scrollEmpty,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5A8BA8" />
          }
        >
          {replies.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nothing yet</Text>
              <Text style={styles.emptyBody}>
                When another soul writes back to you, their note appears here — then quietly
                fades within a day. Pull down to check again.
              </Text>
            </View>
          ) : (
            groups.map((g) => {
              const postFade = fadesInLabel(g.items[0]?.post_expires_at);
              // The post's creation day picks the prompt variant, so the label
              // is the question the poster actually answered (posts live 24h).
              const postExpiry = g.items[0]?.post_expires_at;
              const postedOn = postExpiry
                ? new Date(new Date(postExpiry).getTime() - 86_400_000)
                : undefined;
              return (
                <View key={g.post_id} style={styles.group}>
                  <View style={styles.contextCard}>
                    <View style={styles.contextLabelRow}>
                      <Text style={styles.contextLabel}>{exchangePrompt(g.postMood, postedOn)}</Text>
                      {postFade && <Text style={styles.fadeText}>{postFade}</Text>}
                    </View>
                    <Text style={styles.contextText}>{g.postText}</Text>
                  </View>
                  {g.items.map((r) => (
                    <NoteCard
                      key={r.id}
                      text={r.text}
                      initialLiked={r.liked}
                      fadeLabel={fadesInLabel(r.expires_at)}
                      onReport={() => handleReport(r.id, r.text)}
                      onBlock={() => handleBlock(r.id)}
                      onLike={() => handleLike(r.id)}
                    />
                  ))}
                </View>
              );
            })
          )}

          {sentToday < MAX_REPLIES_PER_DAY && (
          <Pressable
            style={styles.respondEntry}
            onPress={() => router.push('/exchange/respond')}
          >
            <View style={styles.respondEntryIcon}>
              <Ionicons name="create-outline" size={20} color="#5A8BA8" />
            </View>
            <View style={styles.respondEntryTextCol}>
              <Text style={styles.respondEntryTitle}>Write to a stranger</Text>
              <Text style={styles.respondEntrySub}>
                {`${MAX_REPLIES_PER_DAY - sentToday} of ${MAX_REPLIES_PER_DAY} reply left today`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9BB5C5" />
          </Pressable>
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
  sentLink: { width: 40, alignItems: 'flex-end' },
  sentLinkText: { fontSize: 15, fontWeight: '600', color: '#7B9AAA' },
  title: { fontSize: 18, fontWeight: '700', color: '#5A8BA8', letterSpacing: 0.3 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 24, paddingTop: 8 },
  scrollEmpty: { flexGrow: 1, justifyContent: 'center' },
  group: { marginBottom: 28 },
  contextCard: {
    backgroundColor: 'rgba(90, 139, 168, 0.10)',
    borderLeftWidth: 3,
    borderLeftColor: '#9BC1D4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7B9AAA',
    letterSpacing: 0.3,
  },
  contextText: { fontSize: 15, lineHeight: 22, color: '#587585', fontWeight: '400' },
  respondEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    alignSelf: 'stretch',
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginTop: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(90, 139, 168, 0.2)',
    shadowColor: '#5A8BA8',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  respondEntryIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(90, 139, 168, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  respondEntryTextCol: { flex: 1, gap: 2 },
  respondEntryTitle: { fontSize: 16, fontWeight: '600', color: '#3A6B80' },
  respondEntrySub: { fontSize: 13, color: '#7B9AAA', fontWeight: '500' },
  contextLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  fadeText: { fontSize: 11, color: '#9AAEBA', fontWeight: '500' },
  empty: { alignItems: 'center', paddingHorizontal: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#5A8BA8' },
  emptyBody: {
    fontSize: 15,
    lineHeight: 23,
    color: '#6B8F9E',
    textAlign: 'center',
    marginTop: 10,
  },
});

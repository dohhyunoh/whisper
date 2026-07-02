import { CrisisCard } from '@/components/exchange/crisis-card';
import { MoodId, MOODS } from '@/data/moods';
import {
  getStrangerPost,
  initExchange,
  StrangerPost,
  submitReply,
} from '@/utils/exchange-api';
import { markRespondedToday } from '@/utils/exchange-state';
import { Events, posthog } from '@/utils/posthog';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function moodWord(mood: MoodId): string {
  return (MOODS.find((m) => m.id === mood)?.label ?? 'something').toLowerCase();
}

function genderWord(gender: string | null): string {
  if (gender === 'Female') return 'A woman';
  if (gender === 'Male') return 'A man';
  return 'Someone';
}

export default function RespondScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [post, setPost] = useState<StrangerPost | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [showCrisis, setShowCrisis] = useState(false);

  useEffect(() => {
    posthog.capture(Events.EXCHANGE_RESPOND_SHOWN);
    let cancelled = false;
    (async () => {
      const ready = await initExchange();
      if (cancelled) return;
      if (!ready) {
        setOffline(true);
        setLoading(false);
        return;
      }
      const p = await getStrangerPost();
      if (cancelled) return;
      setPost(p);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toDeck = () => router.replace('/daily-deck');

  const handleSkip = () => {
    posthog.capture(Events.EXCHANGE_SKIPPED);
    toDeck();
  };

  const handleSend = async () => {
    const text = reply.trim();
    if (!text || sending || !post) return;
    setBlocked(null);
    setSending(true);

    // Moderation happens server-side; act on the verdict it returns.
    const result = await submitReply(post.id, text);
    if (result.status === 'ok') {
      await markRespondedToday();
      posthog.capture(Events.EXCHANGE_REPLY_SENT, { mood: post.mood });
      if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/exchange/compose');
      return;
    }

    setSending(false);
    if (result.status === 'crisis') {
      posthog.capture(Events.EXCHANGE_CRISIS_ROUTED, { surface: 'reply' });
      setShowCrisis(true);
    } else if (result.status === 'blocked') {
      posthog.capture(Events.EXCHANGE_FILTER_BLOCKED, { surface: 'reply' });
      setBlocked("Let's keep this kind — that one can't go through.");
    } else {
      setBlocked("That didn't send. Check your connection and try again.");
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color="#5A8BA8" />
            </View>
          ) : offline ? (
            <View style={styles.center}>
              <Text style={styles.eyebrow}>The exchange is quiet</Text>
              <Text style={styles.bigPrompt}>We couldn&apos;t reach the others right now.</Text>
              <Text style={styles.sub}>Your deck is still waiting for you.</Text>
              <Pressable style={styles.primaryBtn} onPress={toDeck}>
                <Text style={styles.primaryText}>Continue</Text>
              </Pressable>
            </View>
          ) : !post ? (
            <View style={styles.center}>
              <Text style={styles.eyebrow}>No notes waiting</Text>
              <Text style={styles.bigPrompt}>No one&apos;s shared yet today.</Text>
              <Text style={styles.sub}>Come back later — or head to your deck.</Text>
              <Pressable style={styles.primaryBtn} onPress={toDeck}>
                <Text style={styles.primaryText}>Continue</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.eyebrow}>
                {genderWord(post.author_gender)} feeling {moodWord(post.mood)} wrote
              </Text>

              <View style={styles.strangerCard}>
                <Text style={styles.strangerText}>{post.text}</Text>
              </View>

              {post.author_tags && post.author_tags.length > 0 && (
                <Text style={styles.tagsLine}>
                  Finds comfort in {post.author_tags.join(' · ')}
                </Text>
              )}

              <Text style={styles.askBack}>Write something back?</Text>

              <TextInput
                style={styles.input}
                placeholder="A few kind words…"
                placeholderTextColor="#A9BFCB"
                value={reply}
                onChangeText={(t) => {
                  setReply(t);
                  if (blocked) setBlocked(null);
                }}
                multiline
                maxLength={500}
                editable={!sending}
                textAlignVertical="top"
              />

              {reply.length > 450 && (
                <Text style={styles.counter}>{reply.length}/500</Text>
              )}
              {blocked && <Text style={styles.blocked}>{blocked}</Text>}

              <Pressable
                style={[styles.primaryBtn, (!reply.trim() || sending) && styles.btnDisabled]}
                onPress={handleSend}
                disabled={!reply.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator color="#5A8BA8" />
                ) : (
                  <Text style={styles.primaryText}>Send</Text>
                )}
              </Pressable>

              <Pressable style={styles.skipBtn} onPress={handleSkip} disabled={sending}>
                <Text style={styles.skipText}>Skip for today</Text>
              </Pressable>

              <Text style={styles.gateHint}>
                Replying opens your own prompt. Skipping sits today out.
              </Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {showCrisis && <CrisisCard onClose={() => setShowCrisis(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  eyebrow: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7B9AAA',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  bigPrompt: {
    fontSize: 22,
    fontWeight: '300',
    color: '#5A8BA8',
    textAlign: 'center',
    marginTop: 10,
  },
  sub: { fontSize: 14, color: '#6B8F9E', textAlign: 'center', marginTop: 8 },
  strangerCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 24,
    padding: 24,
    marginTop: 14,
    shadowColor: '#5A8BA8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  strangerText: { fontSize: 19, lineHeight: 28, color: '#4E6B7A', fontWeight: '400' },
  tagsLine: {
    fontSize: 13,
    color: '#8AA3B0',
    fontStyle: 'italic',
    marginTop: 12,
    paddingHorizontal: 4,
    lineHeight: 19,
  },
  askBack: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5A8BA8',
    marginTop: 28,
    marginBottom: 12,
  },
  input: {
    minHeight: 120,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    padding: 18,
    fontSize: 17,
    lineHeight: 24,
    color: '#3E5C6E',
  },
  counter: { fontSize: 12, color: '#9AAEBA', marginTop: 6, textAlign: 'right' },
  blocked: { fontSize: 13.5, color: '#C98A7A', marginTop: 10, paddingHorizontal: 4 },
  primaryBtn: {
    marginTop: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(184, 217, 232, 0.4)',
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#5A8BA8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  btnDisabled: { opacity: 0.4 },
  primaryText: { fontSize: 17, fontWeight: '700', color: '#5A8BA8', letterSpacing: 0.5 },
  skipBtn: { marginTop: 16, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 20 },
  skipText: { fontSize: 15, fontWeight: '500', color: '#90A6B2' },
  gateHint: {
    fontSize: 12.5,
    color: '#9AAEBA',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
  },
});

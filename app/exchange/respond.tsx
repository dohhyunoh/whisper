import { CrisisCard } from '@/components/exchange/crisis-card';
import { MoodId, MOODS } from '@/data/moods';
import allQuotes from '@/data/quotes';
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
import Animated, { FadeInDown } from 'react-native-reanimated';

function moodWord(mood: MoodId): string {
  return (MOODS.find((m) => m.id === mood)?.label ?? 'something').toLowerCase();
}

function genderWord(gender: string | null): string {
  if (gender === 'Female') return 'A woman';
  if (gender === 'Male') return 'A man';
  return 'Someone';
}

function joinWords(words: string[]): string {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

const TAG_NAMESPACES = ['emotion', 'situation', 'theme', 'need', 'tone'];

// Posts written before compose sent namespaced tags carry bare display labels
// ("self worth", "gentle"). No label is used by two namespaces, so the
// namespace can be recovered from the quote vocabulary — keeps the context
// line alive on old posts until they expire. Built lazily, once.
let labelNamespaces: Map<string, string> | null = null;
function namespaceForLabel(label: string): string | null {
  if (!labelNamespaces) {
    labelNamespaces = new Map();
    for (const q of allQuotes) {
      for (const t of q.tags ?? []) {
        const [ns, ...rest] = t.split(':');
        if (rest.length > 0) labelNamespaces.set(rest.join(':').replace(/-/g, ' '), ns);
      }
    }
  }
  return labelNamespaces.get(label) ?? null;
}

// The author's soul-signature tags are namespaced (emotion:exhaustion,
// tone:gentle, theme:self-worth, …) and each kind means something different:
// emotions/situations are what they're carrying, themes/needs are what
// comforts them, tones are how they like to be spoken to. Phrase each group
// accordingly instead of prefixing everything with "finds comfort in".
// Returns null (line hidden) only if no tag can be classified.
function describeAuthor(tags: string[]): string | null {
  const namespaced = tags
    .map((t) => {
      if (TAG_NAMESPACES.includes(t.split(':')[0])) return t;
      const ns = namespaceForLabel(t);
      return ns ? `${ns}:${t}` : null;
    })
    .filter((t): t is string => t !== null);

  // Last segment so sub-namespaced tags read naturally
  // (theme:faith:christianity → "christianity").
  const label = (t: string) => (t.split(':').pop() ?? '').replace(/-/g, ' ');
  const pick = (...namespaces: string[]) =>
    namespaced.filter((t) => namespaces.includes(t.split(':')[0])).map(label);

  const carrying = pick('emotion', 'situation');
  const comforts = pick('theme', 'need');
  const tones = pick('tone');

  const parts: string[] = [];
  if (carrying.length) parts.push(`carrying ${joinWords(carrying)} lately`);
  if (comforts.length) parts.push(`finds comfort in ${joinWords(comforts)}`);
  if (tones.length) parts.push(`${joinWords(tones)} words land best`);
  if (parts.length === 0) return null;

  const line = parts.join(' · ');
  return line.charAt(0).toUpperCase() + line.slice(1);
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
              <Animated.View entering={FadeInDown.duration(500)}>
                <View style={styles.eyebrowRow}>
                  {MOODS.find((m) => m.id === post.mood)?.icon(16, '#7B9AAA')}
                  <Text style={styles.eyebrow}>
                    {genderWord(post.author_gender)} feeling {moodWord(post.mood)} wrote
                  </Text>
                </View>

                <View style={styles.strangerCard}>
                  <Text style={styles.strangerText}>{post.text}</Text>
                </View>

                {post.author_tags &&
                  post.author_tags.length > 0 &&
                  (() => {
                    const line = describeAuthor(post.author_tags);
                    return line ? <Text style={styles.tagsLine}>{line}</Text> : null;
                  })()}
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(500).delay(200)}>
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
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(500).delay(350)}>
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
              </Animated.View>
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
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
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

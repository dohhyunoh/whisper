import { CrisisCard } from '@/components/exchange/crisis-card';
import { MIN_POST_CHARS } from '@/constants/exchange';
import { useAppContext } from '@/context/app-context';
import { exchangePrompt } from '@/data/exchange-prompts';
import { MoodId } from '@/data/moods';
import { submitPost } from '@/utils/exchange-api';
import { getExchangeDayState, markPostedToday } from '@/utils/exchange-state';
import { computeSignature } from '@/utils/soul-signature';
import { Events, posthog } from '@/utils/posthog';
import { getTodayDateString } from '@/utils/streak';
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

export default function ComposeScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useAppContext();

  // Today's checked-in mood drives the prompt; fall back gently if missing.
  const mood = (state.moodHistory.find((e) => e.date === getTodayDateString())?.mood ??
    'cloudy') as MoodId;
  const prompt = exchangePrompt(mood, new Date());

  const [checking, setChecking] = useState(true);
  const [answer, setAnswer] = useState('');
  const [sending, setSending] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [showCrisis, setShowCrisis] = useState(false);

  // Guard: posting is once a day. (The old reply-first gate is gone — the
  // check-in flow now leads with confession and invites a reply afterwards.)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { posted } = await getExchangeDayState();
      if (cancelled) return;
      // In dev we skip the guard so `whisper://exchange/compose` can be
      // deep-linked to test posting in isolation, repeatedly. (`__DEV__` is
      // false in release, so the real guard still holds in production.)
      if (!__DEV__ && posted) {
        router.replace('/daily-deck');
        return;
      }
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleShare = async () => {
    const text = answer.trim();
    if (text.length < MIN_POST_CHARS || sending) return;
    setBlocked(null);
    setSending(true);

    // Attach author context (gender + top soul-signature tags) so the responder
    // can write something concrete. Omit "Prefer not to say". Send the full
    // namespaced tag (emotion:/tone:/theme:/…) — the respond screen needs the
    // namespace to phrase each kind correctly ("carrying exhaustion" vs
    // "gentle words land best").
    const gender =
      state.user?.gender && state.user.gender !== 'Prefer not to say'
        ? state.user.gender
        : null;
    const tags = computeSignature().nodes.map((n) => n.tag);

    // Moderation happens server-side; act on the verdict it returns.
    const result = await submitPost(mood, text, { gender, tags });
    if (result.status === 'ok') {
      await markPostedToday();
      posthog.capture(Events.EXCHANGE_POST_SENT, { mood });
      if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Reciprocity moment: their note is out searching for a reader — invite
      // them to be that reader for someone else while they wait.
      router.replace({ pathname: '/exchange/respond', params: { from: 'post' } });
      return;
    }

    setSending(false);
    if (result.status === 'crisis') {
      posthog.capture(Events.EXCHANGE_CRISIS_ROUTED, { surface: 'post' });
      setShowCrisis(true);
    } else if (result.status === 'blocked') {
      posthog.capture(Events.EXCHANGE_FILTER_BLOCKED, { surface: 'post' });
      setBlocked("Let's keep this kind — that one can't go through.");
    } else {
      setBlocked("That didn't send. Check your connection and try again.");
    }
  };

  if (checking) {
    return (
      <View style={[styles.container, styles.center]}>
        <LinearGradient
          colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
          locations={[0, 0.3, 0.7, 1]}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator color="#5A8BA8" />
      </View>
    );
  }

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
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.eyebrow}>Somewhere, a stranger is listening.</Text>
          <Text style={styles.prompt}>{prompt}</Text>

          <TextInput
            style={styles.input}
            placeholder="Say as much or as little as you like…"
            placeholderTextColor="#A9BFCB"
            value={answer}
            onChangeText={(t) => {
              setAnswer(t);
              if (blocked) setBlocked(null);
            }}
            multiline
            maxLength={500}
            editable={!sending}
            autoFocus
            textAlignVertical="top"
          />

          {answer.trim().length > 0 && answer.trim().length < MIN_POST_CHARS ? (
            <Text style={styles.counter}>{answer.trim().length}/{MIN_POST_CHARS}</Text>
          ) : answer.length > 450 ? (
            <Text style={styles.counter}>{answer.length}/500</Text>
          ) : null}
          {blocked && <Text style={styles.blocked}>{blocked}</Text>}

          <Pressable
            style={[styles.primaryBtn, (answer.trim().length < MIN_POST_CHARS || sending) && styles.btnDisabled]}
            onPress={handleShare}
            disabled={answer.trim().length < MIN_POST_CHARS || sending}
          >
            {sending ? (
              <ActivityIndicator color="#5A8BA8" />
            ) : (
              <Text style={styles.primaryText}>Send</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.skipBtn}
            onPress={() => router.replace('/daily-deck')}
            disabled={sending}
          >
            <Text style={styles.skipText}>Not today</Text>
          </Pressable>

          <Text style={styles.gateHint}>
            One person will write back. Your words quietly fade within a day.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {showCrisis && <CrisisCard onClose={() => setShowCrisis(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: { flexGrow: 1, paddingHorizontal: 28 },
  eyebrow: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7B9AAA',
    letterSpacing: 0.4,
  },
  prompt: {
    fontSize: 26,
    fontWeight: '300',
    color: '#5A8BA8',
    marginTop: 10,
    marginBottom: 22,
    lineHeight: 34,
  },
  input: {
    minHeight: 160,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    padding: 18,
    fontSize: 18,
    lineHeight: 26,
    color: '#3E5C6E',
  },
  counter: { fontSize: 12, color: '#9AAEBA', marginTop: 6, textAlign: 'right' },
  blocked: { fontSize: 13.5, color: '#C98A7A', marginTop: 10, paddingHorizontal: 4 },
  primaryBtn: {
    marginTop: 24,
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
    marginTop: 12,
    lineHeight: 18,
  },
});

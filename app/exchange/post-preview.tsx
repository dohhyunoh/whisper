import { describeAuthor } from '@/app/exchange/respond';
import { MoodId, MOODS } from '@/data/moods';
import { PREVIEW_POSTS } from '@/data/preview-posts';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Marketing-only mirror of the respond screen. Renders PREVIEW_POSTS from
// local data and never touches Supabase, PostHog, or exchange state — Send
// fakes a short spinner then advances to the next post. Not linked from any
// screen; open it via deep link:
//   whisper://exchange/post-preview        (starts at post 1)
//   whisper://exchange/post-preview?post=5 (starts at post 5)
// Tapping the "…wrote" line above the card also advances to the next post,
// so nothing extra appears in screenshots or recordings.

function moodWord(mood: MoodId): string {
  return (MOODS.find((m) => m.id === mood)?.label ?? 'something').toLowerCase();
}

function genderWord(gender: string | null): string {
  if (gender === 'Female') return 'A woman';
  if (gender === 'Male') return 'A man';
  return 'Someone';
}

export default function PostPreviewScreen() {
  const insets = useSafeAreaInsets();
  const { post: postParam } = useLocalSearchParams<{ post?: string }>();
  const initial = Math.min(
    Math.max(parseInt(postParam ?? '1', 10) || 1, 1),
    PREVIEW_POSTS.length,
  );
  const [index, setIndex] = useState(initial - 1);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const sendTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const post = PREVIEW_POSTS[index];

  const advance = () => {
    setIndex((i) => (i + 1) % PREVIEW_POSTS.length);
    setReply('');
  };

  const handleSend = () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    sendTimer.current = setTimeout(() => {
      if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSending(false);
      advance();
    }, 700);
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
          <Animated.View key={post.id} entering={FadeInDown.duration(500)}>
            <Pressable style={styles.eyebrowRow} onPress={advance}>
              {MOODS.find((m) => m.id === post.mood)?.icon(16, '#7B9AAA')}
              <Text style={styles.eyebrow}>
                {genderWord(post.author_gender)} feeling {moodWord(post.mood)} wrote
              </Text>
            </Pressable>

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
              onChangeText={setReply}
              multiline
              maxLength={500}
              editable={!sending}
              textAlignVertical="top"
            />

            {reply.length > 450 && <Text style={styles.counter}>{reply.length}/500</Text>}
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

            <Pressable style={styles.skipBtn} onPress={advance} disabled={sending}>
              <Text style={styles.skipText}>Skip for today</Text>
            </Pressable>

            <Text style={styles.gateHint}>
              Replying opens your own prompt. Skipping sits today out.
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28 },
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

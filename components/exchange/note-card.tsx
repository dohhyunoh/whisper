import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

// A single received reply — the comfort that flowed back in. Quiet by design:
// no sender, no timestamp prominence, no counts. Just the words, a heart to let
// the giver know they landed, and a way to report if they're not kind.

export function NoteCard({
  text,
  initialLiked = false,
  onReport,
  onBlock,
  onLike,
}: {
  text: string;
  initialLiked?: boolean;
  onReport: () => void;
  onBlock: () => void;
  onLike: () => void;
}) {
  // Seed from the persisted like so the heart survives reload/refocus, rather
  // than resetting to empty on every mount.
  const [liked, setLiked] = useState(initialLiked);

  const handleLike = () => {
    if (liked) return;
    setLiked(true);
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLike();
  };

  const openActions = () => {
    Alert.alert(
      'This note',
      'Report it for review, or block the sender so they can never reach you again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', onPress: onReport },
        { text: 'Block sender', style: 'destructive', onPress: onBlock },
      ],
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.quoteMark}>&ldquo;</Text>
      <Text style={styles.text}>{text}</Text>
      <View style={styles.actionRow}>
        <Pressable hitSlop={10} onPress={handleLike} style={styles.likeBtn}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? '#E8869B' : '#B0BFC8'}
          />
          {liked && <Text style={styles.likedText}>Thanked</Text>}
        </Pressable>
        <Pressable hitSlop={10} onPress={openActions} style={styles.reportBtn}>
          <Text style={styles.reportText}>Report / Block</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 22,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 22,
    marginBottom: 16,
    shadowColor: '#5A8BA8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
  },
  quoteMark: { fontSize: 30, color: '#B8D0DD', height: 22, fontWeight: '700' },
  text: { fontSize: 17, lineHeight: 26, color: '#4E6B7A', fontWeight: '400', marginTop: 2 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 2 },
  likedText: { fontSize: 12, color: '#E8869B', fontWeight: '600' },
  reportBtn: { paddingVertical: 4, paddingHorizontal: 6 },
  reportText: { fontSize: 12, color: '#B0BFC8', fontWeight: '500' },
});

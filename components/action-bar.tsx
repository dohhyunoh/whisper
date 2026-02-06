import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LikeButton } from '@/components/like-button';
import { ShareButton } from '@/components/share-button';
import { Quote } from '@/data/types';
import { useLikes } from '@/hooks/use-likes';

interface ActionBarProps {
  quote: Quote | null;
  color: string;
  style?: StyleProp<ViewStyle>;
}

export function ActionBar({ quote, color, style }: ActionBarProps) {
  const { isLiked, toggleLike } = useLikes();

  if (!quote) return null;

  return (
    <View style={[styles.container, style]}>
      <ShareButton quote={quote} color={color} />
      <LikeButton
        liked={isLiked(quote.id)}
        onToggle={() => toggleLike(quote.id)}
        color={color}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

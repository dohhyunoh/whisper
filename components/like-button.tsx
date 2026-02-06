import { IconSymbol } from '@/components/ui/icon-symbol';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, View } from 'react-native';

interface LikeButtonProps {
  liked: boolean;
  onToggle: () => void;
  color: string;
}

export function LikeButton({ liked, onToggle, color }: LikeButtonProps) {
  const handlePress = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onToggle();
  };

  return (
    <Pressable onPress={handlePress} hitSlop={12}>
      <View>
        <IconSymbol
          name={liked ? 'heart.fill' : 'heart'}
          size={38}
          color={liked ? '#E85D75' : color}
        />
      </View>
    </Pressable>
  );
}

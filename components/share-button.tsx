import ShareIconSvg from '@/assets/svg/share_icon/ShareIconSvg';
import { ShareSheet } from '@/components/share-sheet';
import { Quote } from '@/data/types';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Pressable } from 'react-native';

interface ShareButtonProps {
  quote: Quote;
  color: string;
  size?: number;
  /** Returns a local image URI for image sharing (from ViewShot capture) */
  onCaptureImage?: () => Promise<string | null>;
}

export function ShareButton({ quote, color, size = 38, onCaptureImage }: ShareButtonProps) {
  const [shared, setShared] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  const handlePress = () => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShared(true);
    setSheetVisible(true);
  };

  return (
    <>
      <Pressable onPress={handlePress} hitSlop={12}>
        <ShareIconSvg size={size} color={color} filled={shared} />
      </Pressable>
      <ShareSheet
        visible={sheetVisible}
        onClose={() => { setSheetVisible(false); setShared(false); }}
        quote={quote}
        onCaptureImage={onCaptureImage}
      />
    </>
  );
}

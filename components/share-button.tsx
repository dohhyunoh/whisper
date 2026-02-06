import { IconSymbol } from '@/components/ui/icon-symbol';
import { Quote } from '@/data/types';
import React from 'react';
import { Pressable, Share } from 'react-native';

interface ShareButtonProps {
  quote: Quote;
  color: string;
  onShare?: () => Promise<void>;
}

export function ShareButton({ quote, color, onShare }: ShareButtonProps) {
  const handlePress = async () => {
    if (onShare) {
      await onShare();
      return;
    }
    const message = quote.source
      ? `"${quote.text}"\n\n— ${quote.author}, ${quote.source}`
      : `"${quote.text}"\n\n— ${quote.author}`;

    await Share.share({ message });
  };

  return (
    <Pressable onPress={handlePress} hitSlop={12}>
      <IconSymbol name="square.and.arrow.up" size={38} color={color} />
    </Pressable>
  );
}

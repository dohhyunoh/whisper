import ShareIconSvg from '@/assets/svg/share_icon/ShareIconSvg';
import { Quote } from '@/data/types';
import React, { useState } from 'react';
import { Pressable, Share } from 'react-native';

interface ShareButtonProps {
  quote: Quote;
  color: string;
  size?: number;
  onShare?: () => Promise<void>;
}

export function ShareButton({ quote, color, size = 38, onShare }: ShareButtonProps) {
  const [shared, setShared] = useState(false);

  const handlePress = async () => {
    setShared(true);
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
      <ShareIconSvg size={size} color={color} filled={shared} />
    </Pressable>
  );
}

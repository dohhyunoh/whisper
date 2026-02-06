import { PremiumButton } from '@/components/premium-button';
import { ProfileButton } from '@/components/profile-button';
import { QuoteFeed } from '@/components/quote-feed';
import { useQuotes } from '@/hooks/use-quotes';
import { hasSeenSwipeHint, markSwipeHintSeen } from '@/utils/storage';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const quotes = useQuotes(undefined, undefined, true);
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  const cardHeight = SCREEN_HEIGHT;

  useEffect(() => {
    hasSeenSwipeHint().then((seen) => {
      if (!seen) {
        setShowSwipeHint(true);
      }
    });
  }, []);

  const handleHintDismissed = useCallback(() => {
    markSwipeHintSeen();
  }, []);

  return (
    <View style={styles.container}>
      <QuoteFeed
        quotes={quotes}
        cardHeight={cardHeight}
        showSwipeHint={showSwipeHint}
        onHintDismissed={handleHintDismissed}
      />

      {/* Premium icon - top right */}
      <PremiumButton
        style={[styles.premiumButton, { top: insets.top + 12 }]}
      />

      {/* Profile icon - bottom right */}
      <ProfileButton
        style={[styles.profileButton, { bottom: insets.bottom + 20 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  premiumButton: {
    position: 'absolute',
    right: 16,
  },
  profileButton: {
    position: 'absolute',
    right: 16,
  },
});

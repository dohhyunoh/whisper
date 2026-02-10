import { PremiumButton } from '@/components/premium-button';
import { ProfileButton } from '@/components/profile-button';
import { QuoteFeed } from '@/components/quote-feed';
import { useQuotes } from '@/hooks/use-quotes';
import { hasSeenSwipeHint, markSwipeHintSeen } from '@/utils/storage';
import { RiveFileFactory, RiveView } from '@rive-app/react-native';
import { BlurView } from 'expo-blur';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RiveFile = Awaited<ReturnType<typeof RiveFileFactory.fromSource>>;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const quotes = useQuotes(undefined, undefined, true);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [riveFile, setRiveFile] = useState<RiveFile | null>(null);

  const cardHeight = screenHeight;

  useEffect(() => {
    hasSeenSwipeHint().then((seen) => {
      if (!seen) {
        setShowSwipeHint(true);
      }
    });
  }, []);

  useEffect(() => {
    RiveFileFactory.fromSource(require('@/assets/rive/blink.riv'), undefined)
      .then(setRiveFile)
      .catch((err) => console.warn('Failed to load Rive file:', err));
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

      {/* Rive blink animation - bottom left */}
      {riveFile && (
        <View style={[styles.riveContainer, { bottom: insets.bottom + 20 }]}>
          <BlurView intensity={80} tint="light" style={styles.blur}>
            <RiveView
              file={riveFile}
              autoPlay
              style={styles.riveAnimation}
            />
          </BlurView>
        </View>
      )}

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
  riveContainer: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 20, 20, 1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  blur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riveAnimation: {
    width: 44,
    height: 132,
  },
});

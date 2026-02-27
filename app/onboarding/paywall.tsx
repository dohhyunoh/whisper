import React, { useEffect } from 'react';
import { posthog, Events } from '@/utils/posthog';
import { Image, Linking, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/context/app-context';

const FEATURES = [
  'Beautiful premium themes',
  'Add your own custom quotes',
  'Unlock all font styles',
  'Ad-free experience',
];

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dispatch } = useAppContext();
  const { width, height } = useWindowDimensions();
  const s = Math.max(0.85, Math.min(1, Math.min(width / 390, height / 844)));

  useEffect(() => {
    posthog.capture(Events.ONBOARDING_SCREEN_VIEWED, { screen_name: 'paywall' });
    posthog.capture(Events.PAYWALL_VIEWED);
  }, []);

  const handleComplete = () => {
    posthog.capture(Events.ONBOARDING_COMPLETED, { method: 'free' });
    dispatch({ type: 'COMPLETE_ONBOARDING' });
    router.replace('/home');
  };

  return (
    <LinearGradient
      colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
      locations={[0, 0.3, 0.7, 1]}
      style={styles.container}
    >
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 16 * s,
            paddingHorizontal: 28 * s,
          },
        ]}
      >
        {/* Scrollable middle content */}
        <View style={styles.middle}>
          {/* Title */}
          <Text style={[styles.title, { fontSize: 28 * s, marginBottom: 20 * s }]}>
            Get Whisper Pro
          </Text>

          {/* Mascot placeholder */}
          <View
            style={[
              styles.mascotContainer,
              {
                width: 100 * s,
                height: 100 * s,
                borderRadius: 50 * s,
                marginBottom: 16 * s,
              },
            ]}
          >
            <Image source={require('@/assets/images/mascot.png')} style={{ width: 80 * s, height: 80 * s }} resizeMode="contain" />
          </View>

          {/* Subtitle */}
          <Text style={[styles.subtitle, { fontSize: 22 * s, marginBottom: 20 * s }]}>
            Unlock Your Mind
          </Text>

          {/* Features */}
          <View style={[styles.features, { gap: 12 * s, marginBottom: 24 * s }]}>
            {FEATURES.map((feature) => (
              <View key={feature} style={[styles.featureRow, { gap: 10 * s }]}>
                <Ionicons name="checkmark-circle" size={20 * s} color="#3A6B80" />
                <Text style={[styles.featureText, { fontSize: 15 * s }]}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom pinned: Continue + footer */}
        <View style={[styles.bottom, { gap: 14 * s }]}>
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              { paddingVertical: 18 * s },
              pressed && styles.pressed,
            ]}
            onPress={handleComplete}
          >
            <Text style={[styles.continueButtonText, { fontSize: 18 * s }]}>
              Continue
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <Pressable onPress={() => Linking.openURL('https://whisperquotes.app/terms')} hitSlop={8}>
              <Text style={[styles.footerText, { fontSize: 11 * s }]}>Terms & Conditions</Text>
            </Pressable>
            <Text style={[styles.footerDivider, { fontSize: 11 * s }]}>|</Text>
            <Pressable onPress={() => Linking.openURL('https://whisperquotes.app/privacy')} hitSlop={8}>
              <Text style={[styles.footerText, { fontSize: 11 * s }]}>Privacy</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    color: '#3A6B80',
    textAlign: 'center',
  },
  mascotContainer: {
    backgroundColor: 'rgba(58, 107, 128, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontWeight: '700',
    color: '#3A6B80',
    textAlign: 'center',
  },
  features: {
    alignSelf: 'stretch',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontWeight: '500',
    color: '#3A6B80',
  },
  bottom: {
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#3A6B80',
    borderRadius: 100,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pressed: {
    transform: [{ translateY: 2 }],
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontWeight: '500',
    color: '#7B9AAA',
  },
  footerDivider: {
    color: 'rgba(122, 154, 170, 0.4)',
  },
});

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '@/context/app-context';

export default function WidgetHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dispatch } = useAppContext();
  const { width, height } = useWindowDimensions();
  const s = Math.max(0.85, Math.min(1, Math.min(width / 390, height / 844)));
  const cardWidth = width - 56 * s * 2;

  const handleComplete = () => {
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
        {/* Title */}
        <View style={styles.titleArea}>
          <Text style={[styles.title, { fontSize: 28 * s }]}>
            Widgets for Your Home Screen
          </Text>
          <Text style={[styles.subtitle, { fontSize: 15 * s, marginTop: 8 * s }]}>
            Beautiful quotes that blend right into your daily view.
          </Text>
        </View>

        {/* Phone mockup */}
        <View style={[styles.phoneFrame, { width: cardWidth, height: cardWidth * 1.8 }]}>
          <HomeScreenMockup s={s} />
        </View>

        {/* Bottom button */}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { paddingVertical: 18 * s },
            pressed && styles.pressed,
          ]}
          onPress={handleComplete}
        >
          <Text style={[styles.buttonText, { fontSize: 18 * s }]}>Get Started</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

function HomeScreenMockup({ s }: { s: number }) {
  return (
    <View style={mockStyles.screen}>
      {/* Large widget on top */}
      <View style={[mockStyles.homeLargeWidget, { marginTop: 30 * s, padding: 16 * s, borderRadius: 20 * s }]}>
        <LinearGradient
          colors={['#B8D9E8', '#F5F5F0']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <Text style={[mockStyles.homeQuoteIcon, { fontSize: 24 * s }]}>{'\u201C\u201C'}</Text>
        <Text style={[mockStyles.homeQuoteLarge, { fontSize: 13 * s, marginTop: 6 * s }]}>
          "What lies behind us and what lies before us are tiny matters compared to what lies within us."
        </Text>
        <Text style={[mockStyles.homeAuthor, { fontSize: 10 * s, marginTop: 6 * s }]}>
          — Ralph Waldo Emerson
        </Text>
      </View>
      <Text style={[mockStyles.widgetLabel, { fontSize: 10 * s, marginTop: 4 * s }]}>Whisper</Text>

      {/* Row: small widget on left + app icons on right */}
      <View style={[mockStyles.homeRow, { marginTop: 12 * s, gap: 10 * s }]}>
        <View style={[mockStyles.homeSmallWidget, { padding: 10 * s, borderRadius: 16 * s }]}>
          <LinearGradient
            colors={['#B8D9E8', '#F5F5F0']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <Text style={[mockStyles.homeQuoteIcon, { fontSize: 18 * s }]}>{'\u201C\u201C'}</Text>
          <Text style={[mockStyles.homeQuoteSmall, { fontSize: 10 * s, marginTop: 4 * s }]}>
            Start where you are. Use what you have.
          </Text>
        </View>

        <View style={[mockStyles.appGridSmall, { gap: 10 * s }]}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={[mockStyles.appIcon, { width: 44 * s, height: 44 * s, borderRadius: 10 * s }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  titleArea: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 16,
  },
  title: {
    fontWeight: '700',
    color: '#3A6B80',
    textAlign: 'center',
  },
  subtitle: {
    fontWeight: '400',
    color: '#5A8BA8',
    textAlign: 'center',
  },
  phoneFrame: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 20,
  },
  button: {
    width: '100%',
    backgroundColor: '#3A6B80',
    borderRadius: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pressed: {
    transform: [{ translateY: 2 }],
  },
});

const mockStyles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
  },
  homeLargeWidget: {
    alignSelf: 'stretch',
    marginHorizontal: 16,
    overflow: 'hidden',
    alignItems: 'center',
  },
  homeQuoteIcon: {
    color: 'rgba(58, 107, 128, 0.35)',
    fontWeight: '700',
  },
  homeQuoteLarge: {
    color: '#3A6B80',
    fontWeight: '500',
    textAlign: 'center',
  },
  homeAuthor: {
    color: 'rgba(58, 107, 128, 0.7)',
  },
  widgetLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    textAlign: 'center',
  },
  homeRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginHorizontal: 16,
  },
  homeSmallWidget: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
  },
  homeQuoteSmall: {
    color: '#3A6B80',
    fontWeight: '500',
    textAlign: 'center',
  },
  appGridSmall: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    width: 98,
  },
  appIcon: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});

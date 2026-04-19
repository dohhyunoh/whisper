import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppContext } from '@/context/app-context';
import { DEFAULT_WIDGET_SETTINGS } from '@/data/types';
import { usePremium } from '@/hooks/use-premium';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WidgetControlScreen() {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useAppContext();
  const { isPremium } = usePremium();
  const storedWidget = state.premium.settings.widget ?? DEFAULT_WIDGET_SETTINGS;
  // Free users can never have own quotes included in the widget
  const widget = isPremium
    ? storedWidget
    : { ...storedWidget, includeOwnQuotes: false };
  const [helpOpen, setHelpOpen] = useState(false);

  const updateWidget = (patch: Partial<typeof widget>) => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch({ type: 'SET_WIDGET_SETTINGS', payload: patch });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => {
          if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }} style={styles.backButton} hitSlop={12}>
          <IconSymbol name="chevron.left" size={24} color="#3A6B80" />
        </Pressable>
        <Text style={styles.headerTitle}>Widget Control</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Feed match note */}
        <Text style={styles.noteText}>Your widget matches with your home feed.</Text>

        {/* Content */}
        <Text style={styles.sectionTitle}>Content</Text>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextBlock}>
              <Text style={styles.rowLabel}>Include Favorites</Text>
              <Text style={styles.rowSub}>Mix your saved favorites into the widget.</Text>
            </View>
            <Switch
              value={widget.includeFavorites}
              onValueChange={(v) => updateWidget({ includeFavorites: v })}
              trackColor={{ false: '#B8C5CC', true: '#3A6B80' }}
              ios_backgroundColor="#B8C5CC"
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          {isPremium ? (
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextBlock}>
                <Text style={styles.rowLabel}>Include Own Quotes</Text>
                <Text style={styles.rowSub}>Mix in quotes you&rsquo;ve written yourself.</Text>
              </View>
              <Switch
                value={widget.includeOwnQuotes}
                onValueChange={(v) => updateWidget({ includeOwnQuotes: v })}
                trackColor={{ false: '#B8C5CC', true: '#3A6B80' }}
                ios_backgroundColor="#B8C5CC"
                thumbColor="#FFFFFF"
              />
            </View>
          ) : (
            <Pressable
              style={styles.toggleRow}
              onPress={() => {
                if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/onboarding/paywall');
              }}
            >
              <View style={styles.toggleTextBlock}>
                <Text style={styles.rowLabel}>Include Own Quotes</Text>
                <Text style={styles.rowSub}>Unlock with Premium to show your own quotes on the widget.</Text>
              </View>
              <IconSymbol name="lock.fill" size={18} color="#7B9AAA" />
            </Pressable>
          )}
        </View>
        <Text style={styles.cardFootnote}>The widget uses your home-feed quotes by default.</Text>

        {/* Help */}
        <Pressable
          style={styles.helpHeader}
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setHelpOpen((v) => !v);
          }}
        >
          <IconSymbol name="questionmark.circle" size={18} color="#5A8BA8" />
          <Text style={styles.helpHeaderText}>How to add a widget</Text>
          <IconSymbol name={helpOpen ? 'chevron.up' : 'chevron.down'} size={16} color="#7B9AAA" />
        </Pressable>
        {helpOpen && (
          <View style={styles.helpBody}>
            <Text style={styles.helpSubtitle}>Home Screen</Text>
            <Text style={styles.helpStep}>1. Touch and hold an empty area of your Home Screen.</Text>
            <Text style={styles.helpStep}>2. Tap the + button in the top-left corner.</Text>
            <Text style={styles.helpStep}>3. Search for &ldquo;Whisper&rdquo; and choose a size.</Text>
            <Text style={styles.helpStep}>4. Tap Add Widget and place it where you&rsquo;d like.</Text>

            <Text style={[styles.helpSubtitle, styles.helpSubtitleSpaced]}>Lock Screen</Text>
            <Text style={styles.helpStep}>1. Wake your iPhone and touch and hold the Lock Screen.</Text>
            <Text style={styles.helpStep}>2. Tap Customize, then choose Lock Screen.</Text>
            <Text style={styles.helpStep}>3. Tap the widget area below the clock (or above it).</Text>
            <Text style={styles.helpStep}>4. Select &ldquo;Whisper&rdquo; and pick a widget size.</Text>
            <Text style={styles.helpStep}>5. Tap Done to save.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F0' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backButton: { padding: 4, width: 32 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#3A6B80' },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 10 },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: '#7B9AAA',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: 16, marginBottom: 2, marginLeft: 4,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12, padding: 14, gap: 12,
  },
  noteText: {
    fontSize: 13, color: '#7B9AAA', lineHeight: 18,
    marginTop: 8, marginLeft: 4,
  },
  rowBetween: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 12,
  },
  rowTextBlock: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: '#3A6B80' },
  rowSub: { fontSize: 12, color: '#7B9AAA', lineHeight: 16 },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: {
    flex: 1, paddingVertical: 10, borderRadius: 999,
    backgroundColor: 'rgba(58, 107, 128, 0.08)', alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 12,
  },
  toggleTextBlock: { flex: 1, gap: 2 },
  onOffGroup: { flexDirection: 'row', gap: 6 },
  onOffPill: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999,
    backgroundColor: 'rgba(58, 107, 128, 0.08)',
  },
  divider: { height: 1, backgroundColor: 'rgba(58, 107, 128, 0.08)' },
  cardFootnote: {
    fontSize: 12, color: '#7B9AAA', lineHeight: 17,
    marginTop: 8, marginLeft: 4,
  },
  pillActive: { backgroundColor: '#3A6B80' },
  pillText: { fontSize: 13, fontWeight: '500', color: '#5A8BA8' },
  pillTextActive: { color: '#FFF', fontWeight: '600' },
  helpHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 24, paddingVertical: 12, paddingHorizontal: 4,
  },
  helpHeaderText: { flex: 1, fontSize: 14, fontWeight: '500', color: '#5A8BA8' },
  helpBody: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12, padding: 14, gap: 8,
  },
  helpStep: { fontSize: 13, color: '#3A6B80', lineHeight: 19 },
  helpSubtitle: {
    fontSize: 13, fontWeight: '700', color: '#3A6B80',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  helpSubtitleSpaced: { marginTop: 6 },
});

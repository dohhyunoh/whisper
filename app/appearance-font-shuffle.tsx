import { IconSymbol } from '@/components/ui/icon-symbol';
import { FONT_OPTIONS } from '@/constants/premium';
import { usePremium } from '@/hooks/use-premium';
import { PremiumFontKey } from '@/data/types';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppearanceFontShuffle() {
  const insets = useSafeAreaInsets();
  const { isPremium, setFontShufflePool } = usePremium();

  // Fonts available to this user (exclude shuffle and system entries)
  const availableFonts = FONT_OPTIONS.filter(
    (f) => f.key !== 'shuffle' && f.key !== 'system' && (isPremium || !f.isPremium)
  );

  // Load saved pool from settings
  const { activeFontShufflePool } = usePremium();

  // Reverse-map font family names to keys for initial selection
  const initialSelected = availableFonts
    .filter((f) => f.fontFamily && activeFontShufflePool.includes(f.fontFamily))
    .map((f) => f.key);

  const [selected, setSelected] = useState<PremiumFontKey[]>(
    initialSelected.length > 0 ? initialSelected : availableFonts.map((f) => f.key)
  );

  const toggle = useCallback((key: PremiumFontKey) => {
    setSelected((prev) => {
      if (prev.includes(key)) {
        // Don't allow deselecting all
        if (prev.length <= 1) return prev;
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  }, []);

  const handleSave = useCallback(() => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFontShufflePool(selected);
    router.back();
  }, [selected, setFontShufflePool]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => {
          if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }} style={styles.backButton} hitSlop={12}>
          <IconSymbol name="chevron.left" size={24} color="#3A6B80" />
        </Pressable>
        <Text style={styles.headerTitle}>Font Shuffle</Text>
        <Pressable onPress={handleSave} hitSlop={12}>
          <Text style={styles.doneButton}>Done</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Choose which fonts to include in shuffle</Text>

        <View style={styles.fontsList}>
          {availableFonts.map((font) => {
            const isSelected = selected.includes(font.key);
            return (
              <Pressable
                key={font.key}
                style={[styles.fontItem, isSelected && styles.fontItemSelected]}
                onPress={() => {
                  if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggle(font.key);
                }}
              >
                <View style={styles.fontInfo}>
                  <Text style={[styles.fontSample, font.fontFamily ? { fontFamily: font.fontFamily } : undefined]}>
                    Aa
                  </Text>
                  <Text style={styles.fontName}>{font.displayName}</Text>
                </View>
                {isSelected && (
                  <IconSymbol name="checkmark.circle.fill" size={20} color="#3A6B80" />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#3A6B80',
    textAlign: 'center',
  },
  doneButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3A6B80',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#7B9AAA',
  },
  fontsList: {
    gap: 6,
  },
  fontItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(122, 154, 170, 0.2)',
  },
  fontItemSelected: {
    borderColor: '#3A6B80',
    backgroundColor: 'rgba(58, 107, 128, 0.05)',
  },
  fontInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fontSample: {
    fontSize: 20,
    color: '#3A6B80',
    width: 36,
    textAlign: 'center',
  },
  fontName: {
    fontSize: 14,
    color: '#3A6B80',
  },
});

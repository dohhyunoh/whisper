import { IconSymbol } from '@/components/ui/icon-symbol';
import { ALL_THEMES, BACKGROUND_THEMES, FONT_OPTIONS, IMAGE_THEMES, isImageTheme } from '@/constants/premium';
import { usePremium } from '@/hooks/use-premium';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Appearance() {
  const insets = useSafeAreaInsets();
  const { isPremium, currentTheme, currentFont, setFont, setBackground, shufflePools, activeShuffleIndex } = usePremium();

  const classicTheme = BACKGROUND_THEMES[0];
  const isClassicSelected = ['default', 'classic-rose', 'classic-amber', 'classic-lavender', 'classic-mint'].includes(currentTheme.key);
  const isPicturesSelected = !isClassicSelected && currentTheme.key !== 'shuffle';
  const isShuffleSelected = currentTheme.key === 'shuffle';

  // Build thumbnail previews for active shuffle pool
  const activePool = shufflePools[activeShuffleIndex]?.themes ?? [];
  const shufflePreviewThemes = activePool.slice(0, 2).map((key) => ALL_THEMES.find((t) => t.key === key)).filter(Boolean);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => {
          if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }} style={styles.backButton} hitSlop={12}>
          <IconSymbol name="chevron.left" size={24} color="#3A6B80" />
        </Pressable>
        <Text style={styles.headerTitle}>Appearance</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subsectionTitle}>Background Theme</Text>

        {/* Classic */}
        <Pressable
          style={[styles.sectionRow, isClassicSelected && styles.sectionRowActive]}
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/appearance-classic');
          }}
        >
          <View style={styles.sectionLeft}>
            <LinearGradient
              colors={classicTheme.gradientColors}
              style={styles.sectionThumb}
              locations={[0, 0.3, 0.7, 1]}
            />
            <Text style={styles.sectionText}>Classic</Text>
          </View>
          <IconSymbol name="chevron.right" size={18} color="#7B9AAA" />
        </Pressable>

        {/* Pictures */}
        <Pressable
          style={[styles.sectionRow, isPicturesSelected && styles.sectionRowActive]}
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/appearance-pictures');
          }}
        >
          <View style={styles.sectionLeft}>
            <View style={styles.sectionThumb}>
              <Image
                source={IMAGE_THEMES[0].imageSource}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.sectionText}>Wallpapers</Text>
          </View>
          <IconSymbol name="chevron.right" size={18} color="#7B9AAA" />
        </Pressable>

        {/* Shuffle */}
        <Pressable
          style={[styles.sectionRow, isShuffleSelected && styles.sectionRowActive]}
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (!isPremium) {
              router.push('/onboarding/paywall');
              return;
            }
            router.push('/appearance-shuffle');
          }}
        >
          <View style={styles.sectionLeft}>
            <View style={styles.sectionThumb}>
              {shufflePreviewThemes.length === 0 ? (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: '#B8D9E8', alignItems: 'center', justifyContent: 'center' }]}>
                  <IconSymbol name="shuffle" size={16} color="#3A6B80" />
                </View>
              ) : (
                shufflePreviewThemes.map((theme, i) => (
                  <View key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: `${i * 50}%` as any, width: '50%', overflow: 'hidden' }}>
                    {theme && isImageTheme(theme) ? (
                      <Image source={theme.imageSource} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    ) : theme && 'gradientColors' in theme ? (
                      <LinearGradient colors={theme.gradientColors} style={StyleSheet.absoluteFill} locations={[0, 0.3, 0.7, 1]} />
                    ) : null}
                  </View>
                ))
              )}
            </View>
            <Text style={styles.sectionText}>Shuffle</Text>
          </View>
          {!isPremium ? (
            <IconSymbol name="lock.fill" size={18} color="#7B9AAA" />
          ) : (
            <IconSymbol name="chevron.right" size={18} color="#7B9AAA" />
          )}
        </Pressable>

        <Text style={styles.subsectionTitle}>Quote Font</Text>
        <View style={styles.fontsList}>
          {FONT_OPTIONS.map((font) => {
            const isSelected = currentFont.key === font.key;
            return (
              <Pressable
                key={font.key}
                style={[styles.fontItem, isSelected && styles.fontItemSelected]}
                onPress={() => {
                  if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (font.isPremium && !isPremium) { router.push('/onboarding/paywall'); return; }
                  setFont(font.key);
                }}
              >
                <View style={styles.fontInfo}>
                  {font.key === 'shuffle' ? (
                    <View style={styles.fontSampleRow}>
                      <Text style={[styles.fontSampleSmall, { fontFamily: 'IndieFlower_400Regular' }]}>Aa</Text>
                      <Text style={[styles.fontSampleSmall, { fontFamily: 'PlayfairDisplay_400Regular' }]}>Aa</Text>
                    </View>
                  ) : (
                    <Text style={[styles.fontSample, font.fontFamily ? { fontFamily: font.fontFamily } : undefined]}>Aa</Text>
                  )}
                  <Text style={styles.fontName}>{font.displayName}</Text>
                </View>
                <View style={styles.fontRightSide}>
                  {font.isPremium && !isPremium && <IconSymbol name="lock.fill" size={16} color="#7B9AAA" />}
                  {isSelected && (
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#3A6B80" />
                  )}
                  {font.key === 'shuffle' && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push('/appearance-font-shuffle');
                      }}
                      hitSlop={8}
                    >
                      <IconSymbol name="chevron.right" size={18} color="#7B9AAA" />
                    </Pressable>
                  )}
                </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#3A6B80',
    textAlign: 'center',
    marginRight: 32,
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 10,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5A8BA8',
    marginTop: 8,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(122, 154, 170, 0.2)',
  },
  sectionRowActive: {
    borderColor: '#3A6B80',
    backgroundColor: 'rgba(58, 107, 128, 0.05)',
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3A6B80',
  },
  fontsList: {
    gap: 6,
    marginTop: 8,
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
  fontSampleRow: {
    flexDirection: 'row',
    width: 36,
    justifyContent: 'center',
    gap: 2,
  },
  fontSampleSmall: {
    fontSize: 16,
    color: '#3A6B80',
  },
  fontName: {
    fontSize: 14,
    color: '#3A6B80',
  },
  fontRightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

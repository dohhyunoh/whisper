import { IconSymbol } from '@/components/ui/icon-symbol';
import { BACKGROUND_THEMES } from '@/constants/premium';
import { usePremium } from '@/hooks/use-premium';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppearanceClassic() {
  const insets = useSafeAreaInsets();
  const { currentTheme, setBackground } = usePremium();
  const { width } = useWindowDimensions();
  const cardWidth = (width - 40 - 12) / 2; // padding 20*2 + gap 12

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <IconSymbol name="chevron.left" size={24} color="#3A6B80" />
        </Pressable>
        <Text style={styles.headerTitle}>Classic</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {BACKGROUND_THEMES.map((theme) => {
            const active = currentTheme.key === theme.key;
            return (
              <Pressable
                key={theme.key}
                style={[styles.themeCard, { width: cardWidth, height: cardWidth / 0.75 }, active && styles.themeCardSelected]}
                onPress={() => setBackground(theme.key)}
              >
                <LinearGradient
                  colors={theme.gradientColors}
                  style={StyleSheet.absoluteFill}
                  locations={[0, 0.3, 0.7, 1]}
                />
                {active && (
                  <View style={styles.checkBadge}>
                    <IconSymbol name="checkmark" size={12} color="#FFF" />
                  </View>
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
    paddingTop: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  themeCardSelected: {
    borderColor: '#3A6B80',
  },
checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#3A6B80',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

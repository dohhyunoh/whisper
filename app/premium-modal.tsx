import React from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { usePremium } from '@/hooks/use-premium';
import { AnyBackgroundTheme, FontOption, isImageTheme } from '@/constants/premium';

export default function PremiumModal() {
  const insets = useSafeAreaInsets();
  const { isPremium, currentTheme, currentFont, setFont, setBackground, allThemes, allFonts } = usePremium();

  const handleClose = () => {
    router.back();
  };

  const handleThemeSelect = (theme: AnyBackgroundTheme) => {
    if (theme.isPremium && !isPremium) {
      Alert.alert('Premium Feature', 'Upgrade to unlock this theme!');
      return;
    }
    setBackground(theme.key);
  };

  const handleFontSelect = (font: FontOption) => {
    if (font.isPremium && !isPremium) {
      Alert.alert('Premium Feature', 'Upgrade to unlock this font!');
      return;
    }
    setFont(font.key);
  };

  const handleUpgrade = () => {
    Alert.alert('Coming Soon', 'Premium upgrade will be available in a future update!');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appearance</Text>
        <Pressable onPress={handleClose} style={styles.closeButton} hitSlop={12}>
          <IconSymbol name="xmark" size={24} color="#5A8BA8" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Status Banner */}
        {isPremium ? (
          <View style={styles.premiumBanner}>
            <Text style={styles.premiumBannerText}>You have Premium access</Text>
          </View>
        ) : (
          <Pressable style={styles.upgradeBanner} onPress={handleUpgrade}>
            <Text style={styles.upgradeBannerTitle}>Unlock Premium</Text>
            <Text style={styles.upgradeBannerText}>Get access to all themes and fonts</Text>
          </Pressable>
        )}

        {/* Background Themes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Background Themes</Text>
          <View style={styles.themesGrid}>
            {allThemes.map((theme) => (
              <Pressable
                key={theme.key}
                style={[
                  styles.themeCard,
                  currentTheme.key === theme.key && styles.themeCardSelected,
                ]}
                onPress={() => handleThemeSelect(theme)}
              >
                {isImageTheme(theme) ? (
                  <View style={styles.themePreview}>
                    <Image
                      source={theme.imageSource}
                      style={styles.themeImage}
                      resizeMode="cover"
                    />
                    {theme.isPremium && !isPremium && (
                      <View style={styles.lockOverlay}>
                        <IconSymbol name="lock.fill" size={20} color="#FFF" />
                      </View>
                    )}
                  </View>
                ) : (
                  <LinearGradient
                    colors={theme.gradientColors}
                    style={styles.themePreview}
                    locations={[0, 0.3, 0.7, 1]}
                  >
                    {theme.isPremium && !isPremium && (
                      <View style={styles.lockOverlay}>
                        <IconSymbol name="lock.fill" size={20} color="#FFF" />
                      </View>
                    )}
                  </LinearGradient>
                )}
                <Text style={styles.themeName}>{theme.displayName}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Font Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quote Font</Text>
          <View style={styles.fontsList}>
            {allFonts.map((font) => (
              <Pressable
                key={font.key}
                style={[
                  styles.fontItem,
                  currentFont.key === font.key && styles.fontItemSelected,
                ]}
                onPress={() => handleFontSelect(font)}
              >
                <View style={styles.fontInfo}>
                  <Text
                    style={[
                      styles.fontSample,
                      font.fontFamily && { fontFamily: font.fontFamily },
                    ]}
                  >
                    {font.key === 'shuffle' ? 'Random' : 'Aa'}
                  </Text>
                  <Text style={styles.fontName}>{font.displayName}</Text>
                </View>
                {font.isPremium && !isPremium && (
                  <IconSymbol name="lock.fill" size={16} color="#7B9AAA" />
                )}
                {currentFont.key === font.key && (
                  <IconSymbol name="checkmark.circle.fill" size={20} color="#3A6B80" />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Upgrade CTA for free users */}
        {!isPremium && (
          <Pressable style={styles.upgradeButton} onPress={handleUpgrade}>
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </Pressable>
        )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(122, 154, 170, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#3A6B80',
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  premiumBanner: {
    backgroundColor: 'rgba(58, 107, 128, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  premiumBannerText: {
    color: '#3A6B80',
    fontWeight: '600',
    fontSize: 16,
  },
  upgradeBanner: {
    backgroundColor: '#3A6B80',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
  },
  upgradeBannerTitle: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 18,
  },
  upgradeBannerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3A6B80',
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeCard: {
    width: '30%',
    alignItems: 'center',
    gap: 8,
  },
  themeCardSelected: {
    transform: [{ scale: 1.05 }],
  },
  themePreview: {
    width: '100%',
    aspectRatio: 0.75,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeImage: {
    width: '100%',
    height: '100%',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeName: {
    fontSize: 12,
    color: '#5A8BA8',
    fontWeight: '500',
  },
  fontsList: {
    gap: 8,
  },
  fontItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
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
    gap: 12,
  },
  fontSample: {
    fontSize: 24,
    color: '#3A6B80',
    width: 40,
    textAlign: 'center',
  },
  fontName: {
    fontSize: 16,
    color: '#3A6B80',
  },
  upgradeButton: {
    backgroundColor: '#3A6B80',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  upgradeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

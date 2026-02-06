import { CollapsibleCategoryList } from '@/components/collapsible-category-list';
import { FavoritesSection } from '@/components/favorites-section';
import { OwnQuotesSection } from '@/components/own-quotes-section';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BACKGROUND_THEMES, IMAGE_THEMES } from '@/constants/premium';
import { useAppContext } from '@/context/app-context';
import { usePremium } from '@/hooks/use-premium';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileModal() {
  const insets = useSafeAreaInsets();
  const { state } = useAppContext();
  const { isPremium, currentTheme, currentFont, setFont, setBackground } = usePremium();
  const userName = state.user?.name || '';

  const classicTheme = BACKGROUND_THEMES[0];
  // Get 4 images for the 2x2 grid preview
  const previewImages = IMAGE_THEMES.slice(0, 4);

  const isClassicSelected = currentTheme.key === 'default';
  const isPremiumThemeSelected = currentTheme.key === 'shuffle' || (currentTheme.key !== 'default');
  const isSystemFontSelected = currentFont.key === 'system';
  const isPremiumFontSelected = !isSystemFontSelected;

  const handleClassicThemePress = () => {
    setBackground('default');
  };

  const handlePremiumThemePress = () => {
    if (!isPremium) {
      router.push('/premium-modal');
      return;
    }
    // Set to shuffle mode (backgrounds will change per quote)
    setBackground('shuffle');
  };

  const handleSystemFontPress = () => {
    setFont('system');
  };

  const handlePremiumFontPress = () => {
    if (!isPremium) {
      router.push('/premium-modal');
      return;
    }
    setFont('shuffle');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with back button */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <IconSymbol name="chevron.left" size={24} color="#3A6B80" />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting + Edit Profile */}
        <View style={styles.headerSection}>
          <Text style={styles.greeting}>Hello{userName ? `, ${userName}` : ''}</Text>
          <Pressable
            style={styles.editProfileCard}
            onPress={() => router.push('/edit-profile')}
          >
            <IconSymbol name="person.fill" size={22} color="#3A6B80" />
            <Text style={styles.editProfileTitle}>Edit Profile</Text>
            <IconSymbol name="chevron.right" size={18} color="#7B9AAA" />
          </Pressable>
        </View>

        {/* Own Quotes Section */}
        <View style={styles.section}>
          <OwnQuotesSection />
        </View>

        {/* Favorites Section */}
        <View style={styles.section}>
          <FavoritesSection />
        </View>

        {/* Appearance Section - Visible to ALL users */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          {/* Themes - 2 Options */}
          <Text style={styles.subsectionTitle}>Background Theme</Text>
          <View style={styles.themesRow}>
            {/* Classic Theme */}
            <Pressable
              style={[styles.themeCardLarge, isClassicSelected && styles.themeCardLargeSelected]}
              onPress={handleClassicThemePress}
            >
              <LinearGradient
                colors={classicTheme.gradientColors}
                style={[styles.themePreviewLarge, isClassicSelected && styles.themePreviewLargeSelected]}
                locations={[0, 0.3, 0.7, 1]}
              />
              <Text style={styles.themeNameLarge}>Classic</Text>
              {isClassicSelected && (
                <View style={styles.checkBadge}>
                  <IconSymbol name="checkmark" size={12} color="#FFF" />
                </View>
              )}
            </Pressable>

            {/* Premium Theme - 2x2 Grid Preview */}
            <Pressable
              style={[styles.themeCardLarge, isPremiumThemeSelected && styles.themeCardLargeSelected]}
              onPress={handlePremiumThemePress}
            >
              <View style={[styles.themePreviewLarge, isPremiumThemeSelected && styles.themePreviewLargeSelected]}>
                <View style={styles.imageGrid}>
                  <View style={styles.imageGridRow}>
                    <Image source={previewImages[0].imageSource} style={styles.gridImage} resizeMode="cover" />
                    <Image source={previewImages[1].imageSource} style={styles.gridImage} resizeMode="cover" />
                  </View>
                  <View style={styles.imageGridRow}>
                    <Image source={previewImages[2].imageSource} style={styles.gridImage} resizeMode="cover" />
                    <Image source={previewImages[3].imageSource} style={styles.gridImage} resizeMode="cover" />
                  </View>
                </View>
              </View>
              <View style={styles.themeNameRow}>
                <Text style={styles.themeNameLarge}>Pictures</Text>
                {!isPremium && <IconSymbol name="lock.fill" size={12} color="#7B9AAA" />}
              </View>
              {isPremiumThemeSelected && (
                <View style={styles.checkBadge}>
                  <IconSymbol name="checkmark" size={12} color="#FFF" />
                </View>
              )}
            </Pressable>
          </View>

          {/* Font Selection - 2 Options */}
          <Text style={styles.subsectionTitle}>Quote Font</Text>
          <View style={styles.fontsList}>
            {/* System Font */}
            <Pressable
              style={[styles.fontItem, isSystemFontSelected && styles.fontItemSelected]}
              onPress={handleSystemFontPress}
            >
              <View style={styles.fontInfo}>
                <Text style={styles.fontSample}>Aa</Text>
                <Text style={styles.fontName}>System</Text>
              </View>
              {isSystemFontSelected && (
                <IconSymbol name="checkmark.circle.fill" size={20} color="#3A6B80" />
              )}
            </Pressable>

            {/* Premium Fonts */}
            <Pressable
              style={[styles.fontItem, isPremiumFontSelected && styles.fontItemSelected]}
              onPress={handlePremiumFontPress}
            >
              <View style={styles.fontInfo}>
                <View style={styles.fontSampleRow}>
                  <Text style={[styles.fontSampleSmall, { fontFamily: 'IndieFlower_400Regular' }]}>Aa</Text>
                  <Text style={[styles.fontSampleSmall, { fontFamily: 'PermanentMarker_400Regular' }]}>Aa</Text>
                </View>
                <Text style={styles.fontName}>Speical Fonts</Text>
              </View>
              <View style={styles.fontRightSide}>
                {!isPremium && <IconSymbol name="lock.fill" size={16} color="#7B9AAA" />}
                {isPremiumFontSelected && (
                  <IconSymbol name="checkmark.circle.fill" size={20} color="#3A6B80" />
                )}
              </View>
            </Pressable>
          </View>
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse Categories</Text>
          <Text style={styles.subsectionTitle}>Toggle checkmarks on or off for your home feed</Text>
          <CollapsibleCategoryList />
        </View>

        {/* Footer Links */}
        <View style={styles.footer}>
          <Pressable onPress={() => Linking.openURL('https://whisper-landing-nu.vercel.app/privacy')} hitSlop={8}>
            <Text style={styles.footerLink}>Privacy</Text>
          </Pressable>
          <Text style={styles.footerSeparator}>·</Text>
          <Pressable onPress={() => Linking.openURL('https://whisper-landing-nu.vercel.app/terms')} hitSlop={8}>
            <Text style={styles.footerLink}>Terms</Text>
          </Pressable>
          <Text style={styles.footerSeparator}>·</Text>
          <Pressable onPress={() => Linking.openURL('https://whisper-landing-nu.vercel.app/contact')} hitSlop={8}>
            <Text style={styles.footerLink}>Contact</Text>
          </Pressable>
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
  headerSection: {
    gap: 50,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '600',
    color: '#3A6B80',
  },
  editProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 16,
  },
  editProfileTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3A6B80',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 3,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3A6B80',
    marginBottom: 5,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5A8BA8',
    marginTop: 8,
  },
  themesRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  themeCardLarge: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  themeCardLargeSelected: {},
  themePreviewLarge: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themePreviewLargeSelected: {
    borderColor: '#3A6B80',
  },
  imageGrid: {
    flex: 1,
    width: '100%',
  },
  imageGridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  gridImage: {
    flex: 1,
    height: '100%',
  },
  themeNameLarge: {
    fontSize: 14,
    color: '#3A6B80',
    fontWeight: '500',
    textAlign: 'center',
  },
  themeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  footerLink: {
    fontSize: 13,
    color: '#7B9AAA',
  },
  footerSeparator: {
    fontSize: 13,
    color: '#9BB5C5',
  },
});

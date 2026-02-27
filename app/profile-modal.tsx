import { CollapsibleCategoryList } from '@/components/collapsible-category-list';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppContext } from '@/context/app-context';
import { useLikes } from '@/hooks/use-likes';
import { usePremium } from '@/hooks/use-premium';
import { router } from 'expo-router';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileModal() {
  const insets = useSafeAreaInsets();
  const { state } = useAppContext();
  const { likedIds } = useLikes();
  const { currentTheme } = usePremium();
  const userName = state.user?.name || '';
  const ownQuoteCount = state.ownQuotes.length;

  const isClassicSelected = currentTheme.key === 'default';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
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
        {/* Greeting */}
        <Text style={styles.greeting}>Hello{userName ? `, ${userName}` : ''}</Text>

        {/* 2x2 Bento Grid */}
        <View style={styles.bentoGrid}>
          {/* Edit Profile */}
          <Pressable
            style={styles.bentoCard}
            onPress={() => router.push('/edit-profile')}
          >
            <View style={[styles.bentoIconWrap, { backgroundColor: 'rgba(58,107,128,0.1)' }]}>
              <IconSymbol name="person.fill" size={22} color="#3A6B80" />
            </View>
            <Text style={styles.bentoLabel}>Edit Profile</Text>
            <Text style={styles.bentoSub}>{userName || 'Set up'}</Text>
          </Pressable>

          {/* Own Quotes */}
          <Pressable
            style={styles.bentoCard}
            onPress={() => router.push('/add-quote-modal')}
          >
            <View style={[styles.bentoIconWrap, { backgroundColor: 'rgba(191,166,201,0.15)' }]}>
              <IconSymbol name="pencil.line" size={22} color="#9B7FB0" />
            </View>
            <Text style={styles.bentoLabel}>Own Quotes</Text>
            <Text style={styles.bentoSub}>{ownQuoteCount} {ownQuoteCount === 1 ? 'quote' : 'quotes'}</Text>
          </Pressable>

          {/* Favorites */}
          <Pressable
            style={styles.bentoCard}
            onPress={() => router.push({ pathname: '/category-feed', params: { favorites: 'true' } })}
          >
            <View style={[styles.bentoIconWrap, { backgroundColor: 'rgba(207,119,119,0.12)' }]}>
              <IconSymbol name="heart.fill" size={22} color="#CF7777" />
            </View>
            <Text style={styles.bentoLabel}>Favorites</Text>
            <Text style={styles.bentoSub}>{likedIds.length} saved</Text>
          </Pressable>

          {/* Appearance */}
          <Pressable
            style={styles.bentoCard}
            onPress={() => router.push('/appearance')}
          >
            <View style={[styles.bentoIconWrap, { backgroundColor: 'rgba(137,207,240,0.15)' }]}>
              <IconSymbol name="paintbrush.fill" size={22} color="#5AADDB" />
            </View>
            <Text style={styles.bentoLabel}>Appearance</Text>
            <Text style={styles.bentoSub}>{isClassicSelected ? 'Classic' : 'Pictures'}</Text>
          </Pressable>
        </View>

        {/* Browse Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse Categories</Text>
          <Text style={styles.sectionSubtitle}>Toggle checkmarks on or off for your home feed</Text>
          <CollapsibleCategoryList />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable onPress={() => Linking.openURL('https://whisperquotes.app/privacy')} hitSlop={8}>
            <Text style={styles.footerLink}>Privacy</Text>
          </Pressable>
          <Text style={styles.footerSeparator}>·</Text>
          <Pressable onPress={() => Linking.openURL('https://whisperquotes.app/terms')} hitSlop={8}>
            <Text style={styles.footerLink}>Terms</Text>
          </Pressable>
          <Text style={styles.footerSeparator}>·</Text>
          <Pressable onPress={() => Linking.openURL('https://whisperquotes.app/contact')} hitSlop={8}>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 3,
    gap: 40,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '600',
    color: '#3A6B80',
  },
  // Bento grid
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  bentoCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  bentoIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3A6B80',
    marginTop: 4,
  },
  bentoSub: {
    fontSize: 13,
    color: '#7B9AAA',
  },
  // Sections
  section: {
    gap: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3A6B80',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5A8BA8',
  },
  // Footer
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

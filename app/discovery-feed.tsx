import { DiscoveryRow } from '@/components/discovery-row';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppContext } from '@/context/app-context';
import { defaultUserData, Quote } from '@/data/types';
import { useLikes } from '@/hooks/use-likes';
import { usePremium } from '@/hooks/use-premium';
import { buildDiscoveryRows } from '@/utils/discovery-feed';
import quotesData from '@/data/quotes';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { DiscoveryCard } from '@/components/discovery-row';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import RevenueCatUI from 'react-native-purchases-ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const allQuotes: Quote[] = quotesData as Quote[];

export default function DiscoveryFeed() {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useAppContext();
  const { likedIds } = useLikes();
  const [showCustomerCenter, setShowCustomerCenter] = useState(false);
  const { status, isPremium, isCategoryLocked, isSubcategoryLocked, todayUnlockedSubcategory } = usePremium();
  const user = { ...defaultUserData, ...state.user };
  const userName = user.name || '';
  const ownQuoteCount = state.ownQuotes.length;

  const interests = user.interests ?? [];
  const [toast, setToast] = useState<{ message: string; icon: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const showToast = useCallback((message: string, icon: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, icon });
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  const discoveryRows = useMemo(
    () => buildDiscoveryRows(
      user,
      allQuotes,
      isCategoryLocked,
      isSubcategoryLocked,
      isPremium ? undefined : todayUnlockedSubcategory,
    ),
    [user.weatherMood, user.heaviestRole, user.heartStatus, user.heartDetail, user.name, interests, isCategoryLocked, isSubcategoryLocked, isPremium, todayUnlockedSubcategory],
  );

  const handleToggle = useCallback((card: DiscoveryCard) => {
    const catKey = card.category.key;
    const subKey = card.subcategory?.key;
    const interestKey = subKey ? `${catKey}:${subKey}` : catKey;

    const current = [...interests];
    const isCurrentlyFollowed = card.isFollowed;

    let updated: string[];
    if (isCurrentlyFollowed) {
      // Remove this interest
      if (subKey && current.includes(catKey)) {
        // Bare category key means all subs on — expand to individual subs minus this one
        const cat = card.category;
        const otherSubs = (cat.subcategories ?? [])
          .filter((s) => s.key !== subKey)
          .map((s) => `${catKey}:${s.key}`);
        updated = [...current.filter((i) => i !== catKey), ...otherSubs];
      } else {
        updated = current.filter((i) => i !== interestKey && !i.startsWith(interestKey + ':'));
      }
    } else {
      // Add this interest
      updated = [...current, interestKey];
    }
    dispatch({ type: 'SET_USER', payload: { ...state.user!, interests: updated } });

    const label = card.subcategory?.label ?? card.category.label;
    if (isCurrentlyFollowed) {
      showToast(`${label} removed from your feed`, 'minus.circle');
    } else {
      showToast(`${label} added to your feed`, 'checkmark.circle.fill');
    }
  }, [interests, dispatch, state.user, showToast]);

  if (showCustomerCenter) {
    return (
      <RevenueCatUI.CustomerCenterView onDismiss={() => setShowCustomerCenter(false)} />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => {
          if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }} style={styles.backButton} hitSlop={12}>
          <IconSymbol name="chevron.left" size={24} color="#3A6B80" />
        </Pressable>
        <Text style={styles.headerTitle}>Discover</Text>
        <Pressable onPress={() => {
          if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/settings');
        }} style={styles.gearButton} hitSlop={12}>
          <IconSymbol name="gearshape.fill" size={22} color="#3A6B80" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>Hello{userName ? `, ${userName}` : ''}</Text>
          <Text style={styles.greetingSub}>Your personalized feed</Text>
        </View>

        {/* Quick Actions Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActions}
        >
          <Pressable
            style={styles.quickAction}
            onPress={() => {
              if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/favorites');
            }}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: 'rgba(207,119,119,0.12)' }]}>
              <IconSymbol name="heart.fill" size={18} color="#CF7777" />
            </View>
            <Text style={styles.quickLabel}>{likedIds.length} Saved</Text>
          </Pressable>

          <Pressable
            style={styles.quickAction}
            onPress={() => {
              if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/own-quotes');
            }}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: 'rgba(191,166,201,0.15)' }]}>
              <IconSymbol name="pencil.line" size={18} color="#9B7FB0" />
            </View>
            <Text style={styles.quickLabel}>{ownQuoteCount} Own Quotes</Text>
          </Pressable>

          <Pressable
            style={styles.quickAction}
            onPress={() => {
              if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/appearance');
            }}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: 'rgba(137,207,240,0.15)' }]}>
              <IconSymbol name="paintbrush.fill" size={18} color="#5AADDB" />
            </View>
            <Text style={styles.quickLabel}>Themes</Text>
          </Pressable>
        </ScrollView>

        {/* Discovery Feed Rows */}
        {discoveryRows.map((row, i) => (
          <DiscoveryRow
            key={`row-${i}`}
            title={row.title}
            subtitle={row.subtitle}
            items={row.items}
            onToggle={handleToggle}
          />
        ))}

        {/* Manage Subscription */}
        {status === 'premium_purchased' && (
          <View style={styles.section}>
            <Pressable
              style={styles.manageSubCard}
              onPress={() => {
                if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowCustomerCenter(true);
              }}
            >
              <IconSymbol name="creditcard.fill" size={20} color="#3A6B80" />
              <Text style={styles.manageSubText}>Manage Subscription</Text>
              <IconSymbol name="chevron.right" size={18} color="#7B9AAA" />
            </Pressable>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable onPress={() => {
            if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Linking.openURL('https://www.whisperquotes.app/privacy');
          }} hitSlop={8}>
            <Text style={styles.footerLink}>Privacy</Text>
          </Pressable>
          <Text style={styles.footerSeparator}>·</Text>
          <Pressable onPress={() => {
            if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Linking.openURL('https://www.whisperquotes.app/terms');
          }} hitSlop={8}>
            <Text style={styles.footerLink}>Terms</Text>
          </Pressable>
          <Text style={styles.footerSeparator}>·</Text>
          <Pressable onPress={() => {
            if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Linking.openURL('https://www.whisperquotes.app/contact');
          }} hitSlop={8}>
            <Text style={styles.footerLink}>Contact</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Toast */}
      {toast && (
        <Animated.View
          entering={SlideInDown.duration(250)}
          exiting={SlideOutDown.duration(200)}
          style={[styles.toast, { bottom: insets.bottom + 16 }]}
        >
          <IconSymbol name={toast.icon as any} size={18} color="#FFFFFF" />
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
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
  },
  gearButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 3,
    gap: 28,
  },
  // Greeting
  greetingSection: {
    paddingHorizontal: 20,
    gap: 4,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '600',
    color: '#3A6B80',
  },
  greetingSub: {
    fontSize: 14,
    color: '#7B9AAA',
  },
  // Quick actions
  quickActions: {
    paddingHorizontal: 20,
    gap: 10,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 8,
  },
  quickIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3A6B80',
  },
  // Sections
  section: {
    paddingHorizontal: 20,
    gap: 15,
  },
  // Manage sub
  manageSubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 16,
  },
  manageSubText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3A6B80',
    flex: 1,
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
  // Toast
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3A6B80',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

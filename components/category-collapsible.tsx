import { IconSymbol } from '@/components/ui/icon-symbol';
import { CategoryInfo } from '@/constants/categories';
import { useAppContext } from '@/context/app-context';
import { usePremium } from '@/hooks/use-premium';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface CategoryCollapsibleProps {
  category: CategoryInfo;
}

export function CategoryCollapsible({ category }: CategoryCollapsibleProps) {
  const [expanded, setExpanded] = useState(false);
  const rotation = useSharedValue(0);
  const { isCategoryLocked, isSubcategoryLocked, todayUnlockedSubcategory, isPremium } = usePremium();
  const { state, dispatch } = useAppContext();

  const hasSubcategories = category.subcategories && category.subcategories.length > 0;
  const isLocked = isCategoryLocked(category.key);
  const isTodayFreeCategory = category.key === todayUnlockedSubcategory.category && !isPremium;

  const interests = state.user?.interests ?? [];
  const isFollowed =
    interests.includes(category.key) ||
    interests.some((i) => i.startsWith(category.key + ':'));

  const handleToggle = (value: boolean) => {
    const updated = value
      ? [...interests.filter((i) => !i.startsWith(category.key + ':')), category.key]
      : interests.filter((i) => i !== category.key && !i.startsWith(category.key + ':'));
    dispatch({ type: 'SET_USER', payload: { ...state.user!, interests: updated } });
  };

  const handleSubToggle = (subKey: string, value: boolean) => {
    let updated: string[];
    if (value) {
      updated = [...interests, category.key + ':' + subKey];
    } else if (interests.includes(category.key)) {
      // Bare key means all subs on — expand to individual subs minus this one
      const otherSubs = category.subcategories!
        .filter((s) => s.key !== subKey)
        .map((s) => category.key + ':' + s.key);
      updated = [...interests.filter((i) => i !== category.key), ...otherSubs];
    } else {
      updated = interests.filter((i) => i !== category.key + ':' + subKey);
    }
    dispatch({ type: 'SET_USER', payload: { ...state.user!, interests: updated } });
  };

  const handlePress = () => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (hasSubcategories) {
      // Always allow expanding to see subcategories (some may be free today)
      setExpanded(!expanded);
      rotation.value = withTiming(expanded ? 0 : 90, { duration: 200 });
    } else if (isLocked) {
      router.push('/onboarding/paywall');
    } else {
      router.push({ pathname: '/category-feed', params: { category: category.key } });
    }
  };

  const handleSubcategoryPress = (subcategoryKey: string) => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSubcategoryLocked(category.key, subcategoryKey)) {
      router.push('/onboarding/paywall');
      return;
    }
    router.push({
      pathname: '/category-feed',
      params: { category: category.key, subcategory: subcategoryKey },
    });
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      {hasSubcategories ? (
        <Pressable onPress={handlePress} style={styles.header}>
          <Text style={[styles.label, isLocked && !isTodayFreeCategory && styles.labelLocked]}>
            {category.label}
          </Text>
          <Animated.View style={chevronStyle}>
            <IconSymbol name="chevron.right" size={18} color="#7B9AAA" />
          </Animated.View>
        </Pressable>
      ) : (
        <View style={styles.headerRow}>
          <Pressable onPress={handlePress} style={[styles.header, styles.headerFill]}>
            <Text style={[styles.label, isLocked && styles.labelLocked]}>
              {category.label}
            </Text>
          </Pressable>
          {isLocked ? (
            <IconSymbol name="lock.fill" size={16} color="#7B9AAA" style={styles.chevronButton} />
          ) : (
            <>
              <Pressable onPress={() => {
                if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleToggle(!isFollowed);
              }} hitSlop={8}>
                <IconSymbol
                  name={isFollowed ? 'checkmark.circle.fill' : 'circle'}
                  size={22}
                  color={isFollowed ? '#3A6B80' : '#C5D5DC'}
                />
              </Pressable>
              <Pressable onPress={handlePress} hitSlop={8} style={styles.chevronButton}>
                <IconSymbol name="chevron.right" size={18} color="#7B9AAA" />
              </Pressable>
            </>
          )}
        </View>
      )}

      {expanded && hasSubcategories && (
        <View style={styles.subcategories}>
          {category.subcategories!.map((sub) => {
            const subLocked = isSubcategoryLocked(category.key, sub.key);
            const isSubFreeToday = !isPremium &&
              category.key === todayUnlockedSubcategory.category &&
              sub.key === todayUnlockedSubcategory.subcategory;
            const subFollowed =
              interests.includes(category.key) ||
              interests.includes(category.key + ':' + sub.key);
            return (
              <View key={sub.key} style={styles.subcategoryRow}>
                <Pressable
                  onPress={() => handleSubcategoryPress(sub.key)}
                  style={styles.subcategoryItemFill}
                >
                  <Text style={[styles.subcategoryLabel, subLocked && styles.labelLocked]}>
                    {sub.label}
                    {isSubFreeToday && ' (Unlocked Today)'}
                  </Text>
                </Pressable>
                {subLocked ? (
                  <IconSymbol name="lock.fill" size={14} color="#7B9AAA" style={styles.chevronButton} />
                ) : (
                  <>
                    <Pressable onPress={() => {
                      if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      handleSubToggle(sub.key, !subFollowed);
                    }} hitSlop={8}>
                      <IconSymbol
                        name={subFollowed ? 'checkmark.circle.fill' : 'circle'}
                        size={22}
                        color={subFollowed ? '#3A6B80' : '#C5D5DC'}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => handleSubcategoryPress(sub.key)}
                      hitSlop={8}
                      style={styles.chevronButton}
                    >
                      <IconSymbol name="chevron.right" size={16} color="#5A8BA8" />
                    </Pressable>
                  </>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  headerFill: {
    flex: 1,
  },
  chevronButton: {
    paddingRight: 16,
  },
  label: {
    fontSize: 16,
    color: '#3A6B80',
    flex: 1,
  },
  labelLocked: {
    color: '#7B9AAA',
  },
  subcategories: {
    paddingLeft: 32,
    paddingBottom: 8,
  },
  subcategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subcategoryItemFill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  subcategoryLabel: {
    fontSize: 15,
    color: '#5A8BA8',
  },
});

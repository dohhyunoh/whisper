import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppContext } from '@/context/app-context';
import { defaultUserData } from '@/data/types';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GENDER_OPTIONS = ['Female', 'Male', 'Other', 'Prefer not to say'];

export default function EditGenderScreen() {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useAppContext();
  const [gender, setGender] = useState<string | null>(state.user?.gender ?? null);

  const handleSave = () => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch({
      type: 'SET_USER',
      payload: { ...defaultUserData, ...state.user, gender: gender ?? '' },
    });
    router.back();
  };

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
        <Text style={styles.headerTitle}>Choose Gender</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>I identify as...</Text>
        <View style={styles.pillList}>
          {GENDER_OPTIONS.map((option) => {
            const isSelected = gender === option;
            return (
              <Pressable
                key={option}
                style={[styles.pill, isSelected && styles.pillSelected]}
                onPress={() => {
                  if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setGender(option);
                }}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                  {option}
                </Text>
                {isSelected && (
                  <IconSymbol name="checkmark.circle.fill" size={20} color="#FFF" />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.bottomArea, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable
          style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </View>
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
    width: 32,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#3A6B80',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3A6B80',
  },
  pillList: {
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(122, 154, 170, 0.2)',
  },
  pillSelected: {
    backgroundColor: '#5A8BA8',
    borderColor: '#5A8BA8',
  },
  pillText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3A6B80',
  },
  pillTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  bottomArea: {
    paddingHorizontal: 20,
  },
  saveButton: {
    width: '100%',
    backgroundColor: '#3A6B80',
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#3A6B80',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  saveButtonPressed: {
    opacity: 0.9,
    transform: [{ translateY: 1 }],
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: 0.3,
  },
});

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppContext } from '@/context/app-context';
import { defaultUserData } from '@/data/types';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GENDER_OPTIONS = ['Female', 'Male', 'Other', 'Prefer not to say'];
const HEART_STATUS_OPTIONS = ['Just me', 'A new partner', 'A long-term partner', 'An ex-partner', 'My family/friends'];
const HEART_DETAIL_BY_STATUS: Record<string, string[]> = {
  'Just me': ['Liberating', 'Lonely', 'Peaceful', 'Searching'],
  'A new partner': ['Honeymoon bliss', 'Stormy seas', 'Comfortable silence', 'Distant'],
  'A long-term partner': ['Honeymoon bliss', 'Stormy seas', 'Comfortable silence', 'Distant'],
  'An ex-partner': ['Fresh wound', 'Scarring over', 'Letting go', 'Looking back'],
};
const ROLE_OPTIONS = ['The Careerist', 'The Caretaker', 'The People Pleaser', 'The Perfectionist', 'The Critic', 'The Strong One'];

type PickerKind = 'name' | 'gender' | 'heartStatus' | 'heartDetail' | 'role' | null;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useAppContext();
  const user = { ...defaultUserData, ...state.user };

  const [picker, setPicker] = useState<PickerKind>(null);
  const [nameDraft, setNameDraft] = useState(user.name);

  useEffect(() => {
    if (picker === 'name') setNameDraft(user.name);
  }, [picker, user.name]);

  const setUserField = (patch: Partial<typeof defaultUserData>) => {
    dispatch({ type: 'SET_USER', payload: { ...defaultUserData, ...state.user, ...patch } });
  };

  const heartDetailOptions = useMemo(
    () => HEART_DETAIL_BY_STATUS[user.heartStatus] ?? [],
    [user.heartStatus],
  );

  const openPicker = (kind: PickerKind) => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPicker(kind);
  };

  const handleSelect = (value: string) => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (picker === 'gender') setUserField({ gender: value });
    if (picker === 'heartStatus') {
      const nextDetailValid = (HEART_DETAIL_BY_STATUS[value] ?? []).includes(user.heartDetail);
      setUserField({ heartStatus: value, heartDetail: nextDetailValid ? user.heartDetail : '' });
      setPicker(HEART_DETAIL_BY_STATUS[value] ? 'heartDetail' : null);
      return;
    }
    if (picker === 'heartDetail') setUserField({ heartDetail: value });
    if (picker === 'role') setUserField({ heaviestRole: value });
    setPicker(null);
  };

  const handleSaveName = () => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setUserField({ name: nameDraft.trim() });
    setPicker(null);
  };

  const optionPickers: Record<Exclude<PickerKind, 'name' | null>, { title: string; options: string[]; current: string }> = {
    gender: { title: 'I identify as...', options: GENDER_OPTIONS, current: user.gender },
    heartStatus: { title: 'Who holds your heart?', options: HEART_STATUS_OPTIONS, current: user.heartStatus },
    heartDetail: { title: 'How does that feel?', options: heartDetailOptions, current: user.heartDetail },
    role: { title: 'Heaviest role you carry', options: ROLE_OPTIONS, current: user.heaviestRole },
  };
  const activeOptions = picker && picker !== 'name' ? optionPickers[picker] : null;

  const renderRow = (icon: string, label: string, value: string, onPress: () => void) => (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        <IconSymbol name={icon as any} size={20} color="#3A6B80" />
        <View style={styles.rowTextContainer}>
          <Text style={styles.rowLabel}>{label}</Text>
          <Text style={styles.rowValue}>{value || 'Not set'}</Text>
        </View>
      </View>
      <IconSymbol name="chevron.right" size={18} color="#7B9AAA" />
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => {
          if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }} style={styles.backButton} hitSlop={12}>
          <IconSymbol name="chevron.left" size={24} color="#3A6B80" />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        <Text style={styles.sectionLabel}>About you</Text>
        {renderRow('pencil', 'Name', user.name, () => openPicker('name'))}
        {renderRow('person.fill', 'Gender', user.gender, () => openPicker('gender'))}

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Discover feed</Text>
        <Text style={styles.intro}>Update these whenever your season of life changes.</Text>
        {renderRow('heart.fill', 'Relationship', user.heartStatus, () => openPicker('heartStatus'))}
        {!!HEART_DETAIL_BY_STATUS[user.heartStatus] &&
          renderRow('sparkles', 'How it feels', user.heartDetail, () => openPicker('heartDetail'))}
        {renderRow('person.fill', 'Heaviest role', user.heaviestRole, () => openPicker('role'))}

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>App</Text>
        {renderRow('square.grid.2x2.fill', 'Widget Control', 'Customize your home & lock screen', () => {
          if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/widget-control');
        })}
      </ScrollView>

      <Modal
        visible={picker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPicker(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPicker(null)} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrapper}
        >
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />
            {picker === 'name' ? (
              <>
                <Text style={styles.sheetTitle}>What should we call you?</Text>
                <TextInput
                  style={styles.textInput}
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  placeholder="Your name"
                  placeholderTextColor="#9BB5C5"
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                />
                <Pressable
                  style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
                  onPress={handleSaveName}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </Pressable>
              </>
            ) : activeOptions ? (
              <>
                <Text style={styles.sheetTitle}>{activeOptions.title}</Text>
                <View style={styles.pillList}>
                  {activeOptions.options.map((option) => {
                    const selected = activeOptions.current === option;
                    return (
                      <Pressable
                        key={option}
                        style={[styles.pill, selected && styles.pillSelected]}
                        onPress={() => handleSelect(option)}
                      >
                        <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{option}</Text>
                        {selected && <IconSymbol name="checkmark.circle.fill" size={20} color="#FFF" />}
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F0' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 4, width: 32 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#3A6B80' },
  headerSpacer: { width: 32 },
  list: { paddingHorizontal: 20, gap: 10, paddingBottom: 32 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7B9AAA',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  sectionLabelSpaced: { marginTop: 18 },
  intro: { fontSize: 14, color: '#7B9AAA', marginBottom: 4, lineHeight: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    padding: 16,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowTextContainer: { gap: 2 },
  rowLabel: { fontSize: 16, fontWeight: '600', color: '#3A6B80' },
  rowValue: { fontSize: 14, color: '#7B9AAA' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheetWrapper: { justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#F5F5F0',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(122, 154, 170, 0.4)',
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '600', color: '#3A6B80', marginBottom: 16 },
  pillList: { gap: 10 },
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
  pillSelected: { backgroundColor: '#5A8BA8', borderColor: '#5A8BA8' },
  pillText: { fontSize: 16, fontWeight: '500', color: '#3A6B80' },
  pillTextSelected: { color: '#FFF', fontWeight: '600' },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(122, 154, 170, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 18,
    color: '#2C3E50',
    marginBottom: 16,
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
  saveButtonPressed: { opacity: 0.9, transform: [{ translateY: 1 }] },
  saveButtonText: { fontSize: 17, fontWeight: '600', color: '#FFF', letterSpacing: 0.3 },
});

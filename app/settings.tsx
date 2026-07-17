import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppContext } from '@/context/app-context';
import { defaultUserData } from '@/data/types';
import { RELIGION_INTEREST_FOR_FAITH } from '@/utils/interest-tags';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GENDER_OPTIONS = ['Female', 'Male', 'Other', 'Prefer not to say'];
const FAITH_OPTIONS = ['Christianity', 'Islam', 'Hinduism', 'Buddhism', 'Judaism', 'General Spirituality', 'No religion'];

type PickerKind = 'name' | 'gender' | 'faith' | null;

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

  const openPicker = (kind: PickerKind) => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPicker(kind);
  };

  const openLink = (url: string) => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url).catch(() => {});
  };

  const handleSelect = (value: string) => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (picker === 'gender') setUserField({ gender: value });
    if (picker === 'faith') {
      // Rewrite the religion-derived interest so the deck's faith gate follows
      // the new answer; all other interests stay untouched. "No religion" maps
      // to nothing, which gates every faith quote.
      const religionInterest = RELIGION_INTEREST_FOR_FAITH[value];
      const interests = (state.user?.interests ?? []).filter((i) => !i.startsWith('religion:'));
      if (religionInterest) interests.push(religionInterest);
      setUserField({ faithDetail: value, interests });
    }
    setPicker(null);
  };

  const handleSaveName = () => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setUserField({ name: nameDraft.trim() });
    setPicker(null);
  };

  // Non-religious onboarding answers (Mindfulness, Stoicism, …) aren't in the
  // picker's options: for the Faith setting they present as "No religion" —
  // which matches how the quote gate already treats them (no religion:*
  // interest → no faith quotes).
  const faithDisplay = user.faithDetail
    ? (FAITH_OPTIONS.includes(user.faithDetail) ? user.faithDetail : 'No religion')
    : '';

  const optionPickers: Record<Exclude<PickerKind, 'name' | null>, { title: string; options: string[]; current: string }> = {
    gender: { title: 'I identify as...', options: GENDER_OPTIONS, current: user.gender },
    faith: { title: 'Words from...', options: FAITH_OPTIONS, current: faithDisplay },
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
        {renderRow('moon.stars.fill', 'Faith', faithDisplay, () => openPicker('faith'))}

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Library</Text>
        {renderRow('heart.fill', 'Favorites', 'Quotes you saved', () => {
          if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/favorites');
        })}
        {renderRow('pencil', 'My Quotes', 'Quotes you wrote', () => {
          if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/own-quotes');
        })}
        {renderRow('paintpalette.fill', 'Themes', 'Fonts and backgrounds', () => {
          if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/appearance');
        })}
        {renderRow('sparkles', 'Soul Signature', 'The Whisper you\'re becoming', () => {
          if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/soul-signature');
        })}

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>App</Text>
        {renderRow('square.grid.2x2.fill', 'Widget Control', 'Customize your home & lock screen', () => {
          if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/widget-control');
        })}
        {renderRow('bell.fill', 'Notifications', 'Daily quotes and messages', () => {
          if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/notification-settings');
        })}

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Support</Text>
        {renderRow('envelope.fill', 'Contact us', 'Questions or report a problem', () =>
          openLink('https://www.whisperquotes.app/contact'),
        )}
        {renderRow('lock.fill', 'Privacy Policy', 'How we handle your data', () =>
          openLink('https://www.whisperquotes.app/privacy'),
        )}
        {renderRow('doc.text.fill', 'Terms of Use', 'The rules of the road', () =>
          openLink('https://www.whisperquotes.app/terms'),
        )}

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

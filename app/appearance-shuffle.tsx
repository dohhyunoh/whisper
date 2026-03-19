import { IconSymbol } from '@/components/ui/icon-symbol';
import { BACKGROUND_THEMES, IMAGE_THEMES } from '@/constants/premium';
import { BackgroundThemeKey } from '@/data/types';
import { useAppContext } from '@/context/app-context';
import { usePremium } from '@/hooks/use-premium';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppearanceShuffle() {
  const insets = useSafeAreaInsets();
  const { state } = useAppContext();
  const { currentTheme, shufflePools, activeShuffleIndex, setShufflePools } = usePremium();
  const { width } = useWindowDimensions();
  const cardWidth = (width - 40 - 12) / 2;

  const [pickerVisible, setPickerVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<BackgroundThemeKey[]>([]);
  const [draftName, setDraftName] = useState('');

  const isShuffleActive = currentTheme.key === 'shuffle';

  const openPickerNew = useCallback(() => {
    setEditingIndex(null);
    setDraft([]);
    setDraftName('');
    setPickerVisible(true);
  }, []);

  const openPoolEditor = useCallback(
    (index: number) => {
      setEditingIndex(index);
      setDraft([...shufflePools[index].themes]);
      setDraftName(shufflePools[index].name);
      setPickerVisible(true);
    },
    [shufflePools]
  );

  const toggleDraft = useCallback((key: BackgroundThemeKey) => {
    setDraft((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  const deletePool = useCallback(
    (index: number) => {
      const pools = [...(state.premium.settings.shufflePools ?? [])];
      pools.splice(index, 1);
      const newActiveIndex = Math.min(activeShuffleIndex, Math.max(0, pools.length - 1));
      setShufflePools(pools, newActiveIndex);
    },
    [state.premium.settings.shufflePools, activeShuffleIndex, setShufflePools]
  );

  const confirmPicker = useCallback(() => {
    if (draft.length === 0) { setPickerVisible(false); return; }
    const pools = [...(state.premium.settings.shufflePools ?? [])];
    const name = draftName.trim() || (editingIndex === null ? `Shuffle ${pools.length + 1}` : pools[editingIndex].name);
    if (editingIndex === null) {
      pools.push({ name, themes: draft });
      setShufflePools(pools, pools.length - 1);
    } else {
      pools[editingIndex] = { name, themes: draft };
      setShufflePools(pools, editingIndex);
    }
    setPickerVisible(false);
  }, [draft, draftName, editingIndex, state.premium.settings.shufflePools, setShufflePools]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => {
          if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }} style={styles.backButton} hitSlop={12}>
          <IconSymbol name="chevron.left" size={24} color="#3A6B80" />
        </Pressable>
        <Text style={styles.headerTitle}>Shuffle</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          <Pressable
            style={[styles.addCardContainer, { width: cardWidth, height: cardWidth / 0.75 }]}
            onPress={() => {
              if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              openPickerNew();
            }}
          >
            <IconSymbol name="plus" size={36} color="#3A6B80" />
            <Text style={styles.addLabel}>Add Shuffles</Text>
          </Pressable>

          {shufflePools.map((pool, i) => {
            const isActive = isShuffleActive && activeShuffleIndex === i;
            return (
              <Pressable
                key={i}
                style={[styles.shuffleCard, { width: cardWidth, height: cardWidth / 0.75 }, isActive && styles.cardSelected]}
                onPress={() => {
                  if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  openPoolEditor(i);
                }}
              >
                <Text style={styles.shuffleCardTitle}>{pool.name}</Text>
                <Text style={styles.shuffleCardCount}>{pool.themes.length} themes</Text>
                {isActive && (
                  <View style={styles.checkBadge}>
                    <IconSymbol name="checkmark" size={12} color="#FFF" />
                  </View>
                )}
                <Pressable style={styles.deleteBadge} onPress={() => {
                  if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  deletePool(i);
                }} hitSlop={8}>
                  <IconSymbol name="trash" size={12} color="#FFF" />
                </Pressable>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={pickerVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => {
              if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setPickerVisible(false);
            }} hitSlop={12}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Pick Themes</Text>
            <Pressable onPress={() => {
              if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              confirmPicker();
            }} hitSlop={12}>
              <Text style={[styles.modalDone, draft.length === 0 && styles.modalDoneDisabled]}>Done</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Name input */}
            <TextInput
              style={styles.nameInput}
              value={draftName}
              onChangeText={setDraftName}
              placeholder={editingIndex === null ? `Shuffle ${(state.premium.settings.shufflePools?.length ?? 0) + 1}` : shufflePools[editingIndex]?.name}
              placeholderTextColor="#A0B8C4"
              returnKeyType="done"
            />

            <Text style={styles.pickerSection}>Classic</Text>
            <View style={styles.grid}>
              {BACKGROUND_THEMES.map((theme) => {
                const selected = draft.includes(theme.key);
                return (
                  <Pressable
                    key={theme.key}
                    style={[styles.pictureCard, { width: cardWidth, height: cardWidth / 0.75 }, selected && styles.cardSelected]}
                    onPress={() => {
                      if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      toggleDraft(theme.key);
                    }}
                  >
                    <LinearGradient
                      colors={theme.gradientColors}
                      style={StyleSheet.absoluteFill}
                      locations={[0, 0.3, 0.7, 1]}
                    />
                    {selected && (
                      <View style={styles.checkBadge}>
                        <IconSymbol name="checkmark" size={12} color="#FFF" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.pickerSection, { marginTop: 20 }]}>Wallpapers</Text>
            <View style={styles.grid}>
              {IMAGE_THEMES.map((theme) => {
                const selected = draft.includes(theme.key);
                return (
                  <Pressable
                    key={theme.key}
                    style={[styles.pictureCard, { width: cardWidth, height: cardWidth / 0.75 }, selected && styles.cardSelected]}
                    onPress={() => {
                      if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      toggleDraft(theme.key);
                    }}
                  >
                    <Image source={theme.imageSource} style={styles.pictureImage} resizeMode="cover" />
                    {selected && (
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
      </Modal>
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
  addCardContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#E8E8E3',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3A6B80',
  },
  shuffleCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#DDE8EE',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  shuffleCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A6B80',
  },
  shuffleCardCount: {
    fontSize: 12,
    color: '#5A8BA8',
  },
  cardSelected: {
    borderColor: '#3A6B80',
  },
  deleteBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(180, 60, 60, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
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
  pictureCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  pictureImage: {
    width: '100%',
    height: '100%',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(122, 154, 170, 0.3)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#3A6B80',
  },
  modalCancel: {
    fontSize: 16,
    color: '#7B9AAA',
  },
  modalDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3A6B80',
  },
  modalDoneDisabled: {
    opacity: 0.4,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  nameInput: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(122, 154, 170, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#3A6B80',
    marginBottom: 20,
  },
  pickerSection: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5A8BA8',
    marginBottom: 10,
  },
});

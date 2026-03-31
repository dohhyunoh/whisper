import { IconSymbol } from '@/components/ui/icon-symbol';
import { IMAGE_THEMES } from '@/constants/premium';
import { usePremium } from '@/hooks/use-premium';
import { Directory, File, Paths } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { ActionSheetIOS, Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppearancePictures() {
  const insets = useSafeAreaInsets();
  const { isPremium, currentTheme, setBackground, addCustomPhotos, removeCustomPhoto, customPhotoUris } = usePremium();
  const { width } = useWindowDimensions();
  const cardWidth = (width - 40 - 12) / 2;

  const pickImage = useCallback(async (useCamera: boolean) => {
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsMultipleSelection: true });

    if (result.canceled || !result.assets?.length) return;

    const destDir = new Directory(Paths.document, 'custom-backgrounds');
    if (!destDir.exists) destDir.create();

    const savedUris: string[] = [];
    for (const asset of result.assets) {
      const sourceFile = new File(asset.uri);
      const filename = `custom-photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.jpg`;
      const destFile = new File(destDir, filename);
      sourceFile.copy(destFile);
      savedUris.push(destFile.uri);
    }

    addCustomPhotos(savedUris);
  }, [addCustomPhotos]);

  const handleAddPhoto = useCallback(() => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) pickImage(true);
          if (index === 2) pickImage(false);
        }
      );
    } else {
      Alert.alert('Add Photo', '', [
        { text: 'Take Photo', onPress: () => pickImage(true) },
        { text: 'Choose from Library', onPress: () => pickImage(false) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [pickImage]);

  const deleteCustomPhoto = useCallback((index: number, uri: string) => {
    // Delete the file from disk
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch {}
    removeCustomPhoto(index);
  }, [removeCustomPhoto]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => {
          if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }} style={styles.backButton} hitSlop={12}>
          <IconSymbol name="chevron.left" size={24} color="#3A6B80" />
        </Pressable>
        <Text style={styles.headerTitle}>Wallpapers</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {/* Add photo card — always visible */}
          <Pressable
            style={[styles.pictureCard, { width: cardWidth, height: cardWidth / 0.75 }]}
            onPress={() => {
              if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (!isPremium) { router.push('/onboarding/paywall'); return; }
              handleAddPhoto();
            }}
          >
            <View style={styles.addCard}>
              <IconSymbol name="plus" size={36} color="#3A6B80" />
              <Text style={styles.addLabel}>Add Photo</Text>
              {!isPremium && (
                <View style={styles.lockBadge}>
                  <IconSymbol name="lock.fill" size={14} color="#FFF" />
                </View>
              )}
            </View>
          </Pressable>

          {/* Custom photo cards */}
          {customPhotoUris.map((uri, i) => {
            const themeKey = `custom-photo-${i}`;
            const isActive = currentTheme.key === themeKey;
            const locked = !isPremium;
            return (
              <Pressable
                key={uri}
                style={[styles.pictureCard, { width: cardWidth, height: cardWidth / 0.75 }, isActive && styles.pictureCardSelected]}
                onPress={() => {
                  if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (locked) { router.push('/onboarding/paywall'); return; }
                  setBackground(themeKey as any);
                }}
              >
                <Image source={{ uri }} style={styles.pictureImage} resizeMode="cover" />
                <Pressable style={styles.deleteBadge} onPress={() => {
                  if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  deleteCustomPhoto(i, uri);
                }} hitSlop={8}>
                  <IconSymbol name="trash" size={12} color="#FFF" />
                </Pressable>
                {locked && (
                  <View style={styles.lockBadge}>
                    <IconSymbol name="lock.fill" size={14} color="#FFF" />
                  </View>
                )}
                {isActive && !locked && (
                  <View style={styles.checkBadge}>
                    <IconSymbol name="checkmark" size={12} color="#FFF" />
                  </View>
                )}
              </Pressable>
            );
          })}

          {IMAGE_THEMES.map((theme) => {
            const active = currentTheme.key === theme.key;
            const locked = theme.isPremium && !isPremium;
            return (
              <Pressable
                key={theme.key}
                style={[styles.pictureCard, { width: cardWidth, height: cardWidth / 0.75 }, active && styles.pictureCardSelected]}
                onPress={() => {
                  if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (locked) { router.push('/onboarding/paywall'); return; }
                  setBackground(theme.key);
                }}
              >
                <Image source={theme.imageSource} style={styles.pictureImage} resizeMode="cover" />
                {locked && (
                  <View style={styles.lockBadge}>
                    <IconSymbol name="lock.fill" size={14} color="#FFF" />
                  </View>
                )}
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
  pictureCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  pictureCardSelected: {
    borderColor: '#3A6B80',
  },
  pictureImage: {
    width: '100%',
    height: '100%',
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
  addCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8E8E3',
    gap: 8,
  },
  addLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3A6B80',
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
  lockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

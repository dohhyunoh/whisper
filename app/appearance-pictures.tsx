import { IconSymbol } from '@/components/ui/icon-symbol';
import { IMAGE_THEMES } from '@/constants/premium';
import { usePremium } from '@/hooks/use-premium';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { ActionSheetIOS, Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppearancePictures() {
  const insets = useSafeAreaInsets();
  const { currentTheme, setBackground, setCustomPhoto, customPhotoUri } = usePremium();
  const { width } = useWindowDimensions();
  const cardWidth = (width - 40 - 12) / 2;

  const pickImage = useCallback(async (useCamera: boolean) => {
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });

    if (result.canceled || !result.assets[0]) return;

    // Copy to persistent document directory
    const sourceUri = result.assets[0].uri;
    const destDir = new Directory(Paths.document, 'custom-backgrounds');
    if (!destDir.exists) destDir.create();
    const sourceFile = new File(sourceUri);
    const destFile = new File(destDir, 'custom-photo.jpg');
    if (destFile.exists) destFile.delete();
    sourceFile.copy(destFile);

    setCustomPhoto(destFile.uri);
  }, [setCustomPhoto]);

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

  const isCustomActive = currentTheme.key === 'custom-photo';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <IconSymbol name="chevron.left" size={24} color="#3A6B80" />
        </Pressable>
        <Text style={styles.headerTitle}>Pictures</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {/* Custom photo card */}
          <Pressable
            style={[styles.pictureCard, { width: cardWidth, height: cardWidth / 0.75 }, isCustomActive && styles.pictureCardSelected]}
            onPress={handleAddPhoto}
            onLongPress={customPhotoUri ? () => setBackground('custom-photo' as any) : undefined}
          >
            {customPhotoUri ? (
              <>
                <Image source={{ uri: customPhotoUri }} style={styles.pictureImage} resizeMode="cover" />
                <View style={styles.addBadge}>
                  <IconSymbol name="plus" size={14} color="#FFF" />
                </View>
                {isCustomActive && (
                  <View style={styles.checkBadge}>
                    <IconSymbol name="checkmark" size={12} color="#FFF" />
                  </View>
                )}
              </>
            ) : (
              <View style={styles.addCard}>
                <IconSymbol name="plus" size={36} color="#3A6B80" />
                <Text style={styles.addLabel}>Add Photo</Text>
              </View>
            )}
          </Pressable>

          {IMAGE_THEMES.map((theme) => {
            const active = currentTheme.key === theme.key;
            return (
              <Pressable
                key={theme.key}
                style={[styles.pictureCard, { width: cardWidth, height: cardWidth / 0.75 }, active && styles.pictureCardSelected]}
                onPress={() => setBackground(theme.key)}
              >
                <Image source={theme.imageSource} style={styles.pictureImage} resizeMode="cover" />
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
  addBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

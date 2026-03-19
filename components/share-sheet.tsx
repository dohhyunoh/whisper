import { WhisperColors } from '@/constants/theme';
import { Quote } from '@/data/types';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import * as MediaLibrary from 'expo-media-library';
import { File as ExpoFile } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useState } from 'react';
import RNShare from 'react-native-share';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── App detection config ──────────────────────────────

interface ShareTarget {
  key: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** FontAwesome6 icon name */
  fa6Icon?: string;
  /** FontAwesome (classic) icon name */
  faIcon?: string;
  iconColor: string;
  bgColor: string;
  scheme?: string;
  openUrl?: string;
}

/** Social apps we check for — order matters (this is display order) */
const SOCIAL_TARGETS: ShareTarget[] = [
  {
    key: 'instagram',
    label: 'Instagram',
    icon: 'logo-instagram',
    iconColor: '#E1306C',
    bgColor: '#FDE8EC',
    scheme: 'instagram',
    openUrl: 'instagram://app',
  },
  {
    key: 'stories',
    label: 'Stories',
    icon: 'logo-instagram',
    iconColor: '#8B5CF6',
    bgColor: '#F3E8FD',
    scheme: 'instagram',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: 'logo-whatsapp',
    iconColor: '#25D366',
    bgColor: '#E8F8EE',
    scheme: 'whatsapp',
    openUrl: 'whatsapp://app',
  },
  {
    key: 'x',
    label: 'X',
    fa6Icon: 'x-twitter',
    iconColor: '#000000',
    bgColor: '#F3F4F6',
    scheme: 'twitter',
    openUrl: 'twitter://app',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: 'logo-facebook',
    iconColor: '#1877F2',
    bgColor: '#E8F0FE',
    scheme: 'fb',
    openUrl: 'fb://feed',
  },
];

interface ShareSheetProps {
  visible: boolean;
  onClose: () => void;
  quote: Quote;
  /** Async function that returns a local image URI (from ViewShot capture) */
  onCaptureImage?: () => Promise<string | null>;
}

const DURATION = 250;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const TOP_GAP = 60;
const DISMISS_THRESHOLD = 120;

export function ShareSheet({ visible, onClose, quote, onCaptureImage }: ShareSheetProps) {
  const insets = useSafeAreaInsets();
  const sheetHeight = SCREEN_HEIGHT - TOP_GAP;
  const translateY = useSharedValue(sheetHeight);
  const backdropOpacity = useSharedValue(0);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [installedApps, setInstalledApps] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const toastOpacity = useSharedValue(0);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    toastOpacity.value = withTiming(1, { duration: 150 });
    // Hold then fade out
    setTimeout(() => {
      toastOpacity.value = withTiming(0, { duration: 500 }, () => {
        runOnJS(setToastMessage)(null);
      });
    }, 1200);
  }, []);

  const toastStyle = useAnimatedStyle(() => ({
    opacity: toastOpacity.value,
  }));

  // Detect which social apps are installed (runs once on mount)
  useEffect(() => {
    const detect = async () => {
      const installed = new Set<string>();
      await Promise.all(
        SOCIAL_TARGETS.map(async (target) => {
          if (!target.scheme) return;
          try {
            const can = await Linking.canOpenURL(`${target.scheme}://`);
            if (can) installed.add(target.key);
          } catch {}
        }),
      );
      setInstalledApps(installed);
    };
    detect();
  }, []);

  // Capture image when sheet opens
  useEffect(() => {
    if (visible && onCaptureImage) {
      setCapturing(true);
      onCaptureImage()
        .then((uri) => setImageUri(uri))
        .catch(() => setImageUri(null))
        .finally(() => setCapturing(false));
    }
    if (!visible) {
      setImageUri(null);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: DURATION });
      backdropOpacity.value = withTiming(1, { duration: DURATION });
    } else {
      translateY.value = withTiming(sheetHeight, { duration: DURATION });
      backdropOpacity.value = withTiming(0, { duration: DURATION });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const dismiss = useCallback(() => {
    translateY.value = withTiming(sheetHeight, { duration: DURATION });
    backdropOpacity.value = withTiming(0, { duration: DURATION }, () => {
      runOnJS(onClose)();
    });
  }, [onClose, sheetHeight]);

  // Swipe-down gesture to dismiss
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
        backdropOpacity.value = 1 - (e.translationY / sheetHeight) * 0.8;
      }
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_THRESHOLD || e.velocityY > 500) {
        translateY.value = withTiming(sheetHeight, { duration: DURATION });
        backdropOpacity.value = withTiming(0, { duration: DURATION }, () => {
          runOnJS(onClose)();
        });
      } else {
        translateY.value = withTiming(0, { duration: DURATION });
        backdropOpacity.value = withTiming(1, { duration: DURATION });
      }
    });

  const formatQuoteText = () => {
    return quote.source
      ? `"${quote.text}"\n\n— ${quote.author}, ${quote.source}`
      : `"${quote.text}"\n\n— ${quote.author}`;
  };

  const saveImageToLibrary = async (): Promise<boolean> => {
    if (!imageUri) return false;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') return false;
      await MediaLibrary.saveToLibraryAsync(imageUri);
      return true;
    } catch {
      return false;
    }
  };

  const getImageBase64 = async (): Promise<string | null> => {
    if (!imageUri) return null;
    try {
      const file = new ExpoFile(imageUri);
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch {
      return null;
    }
  };

  // ── Actions ──────────────────────────────────────────

  const handleCopyText = async () => {
    await Clipboard.setStringAsync(formatQuoteText());
    if (process.env.EXPO_OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast('Copied to clipboard');
  };

  const handleMessages = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Small delay so haptic fires before app switch
    await new Promise((r) => setTimeout(r, 50));
    const body = encodeURIComponent(formatQuoteText());
    await Linking.openURL(`sms:&body=${body}`);
  };

  const handleSocialApp = async (target: ShareTarget) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Small delay so haptic fires before app switch
    await new Promise((r) => setTimeout(r, 50));

    try {
      // X — deep link to compose screen with quote text
      if (target.key === 'x') {
        const text = encodeURIComponent(formatQuoteText());
        await Linking.openURL(`twitter://post?message=${text}`);
        return;
      }

      // WhatsApp — use URL scheme with text
      if (target.key === 'whatsapp') {
        const text = encodeURIComponent(formatQuoteText());
        await Linking.openURL(`whatsapp://send?text=${text}`);
        return;
      }

      if (!imageUri) return;

      // Instagram & Stories require Base64 payloads
      if (target.key === 'stories' || target.key === 'instagram') {
        const base64 = await getImageBase64();
        if (!base64) return;
        const base64Url = `data:image/png;base64,${base64}`;

        await RNShare.shareSingle({
          social: target.key === 'stories'
            ? RNShare.Social.INSTAGRAM_STORIES as any
            : RNShare.Social.INSTAGRAM as any,
          ...(target.key === 'stories'
            ? { backgroundImage: base64Url, appId: 'com.dohhyun.whisper' }
            : { url: base64Url }),
        });
        return;
      }

      // Facebook — file URI works
      if (target.key === 'facebook') {
        await RNShare.shareSingle({
          url: imageUri,
          social: RNShare.Social.FACEBOOK as any,
        });
        return;
      }

      // Fallback — just open the app
      if (target.openUrl) {
        await Linking.openURL(target.openUrl);
      }
    } catch (error) {
      console.log(`Failed to share to ${target.key}:`, error);
    }
  };

  const handleSaveImage = async () => {
    const saved = await saveImageToLibrary();
    if (saved) {
      if (process.env.EXPO_OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Saved to Photos');
    }
  };

  const handleMore = async () => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoadingMore(true);
    // Clear spinner after a short delay — the native sheet takes over visually
    setTimeout(() => setLoadingMore(false), 1000);
    if (imageUri) {
      await Sharing.shareAsync(imageUri, { mimeType: 'image/png' });
    } else {
      await Share.share({ message: formatQuoteText() });
    }
  };

  // Filter social targets to only installed apps
  const visibleSocials = SOCIAL_TARGETS.filter((t) => installedApps.has(t.key));

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={dismiss}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        </Animated.View>

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sheet, { height: sheetHeight }, sheetStyle]}>
            <View style={styles.handle} />

            {/* Image preview */}
            {onCaptureImage && (
              <View style={styles.previewContainer}>
                {capturing ? (
                  <View style={styles.previewPlaceholder}>
                    <ActivityIndicator color={WhisperColors.primary} />
                  </View>
                ) : imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
                ) : null}
              </View>
            )}

            {/* Toast overlay */}
            {toastMessage && (
              <Animated.View style={[styles.toast, toastStyle]} pointerEvents="none">
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.toastText}>{toastMessage}</Text>
              </Animated.View>
            )}

            {/* Native actions row */}
            <View style={[styles.actionsSection, visibleSocials.length === 0 && { paddingBottom: insets.bottom + 16 }]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.grid}
              >
                <Pressable style={styles.option} onPress={handleCopyText}>
                  <View style={[styles.iconCircle, { backgroundColor: '#E8F4FD' }]}>
                    <Ionicons name="copy-outline" size={24} color={WhisperColors.primary} />
                  </View>
                  <Text style={styles.optionLabel}>Copy Text</Text>
                </Pressable>

                {onCaptureImage && (
                  <Pressable style={styles.option} onPress={handleSaveImage}>
                    <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
                      <Ionicons name="download-outline" size={24} color="#FF9800" />
                    </View>
                    <Text style={styles.optionLabel}>Save Image</Text>
                  </Pressable>
                )}

                <Pressable style={styles.option} onPress={handleMessages}>
                  <View style={[styles.iconCircle, { backgroundColor: '#E8F8EE' }]}>
                    <Ionicons name="chatbubble-outline" size={24} color="#34C759" />
                  </View>
                  <Text style={styles.optionLabel}>Messages</Text>
                </Pressable>

                <Pressable style={styles.option} onPress={handleMore}>
                  <View style={[styles.iconCircle, { backgroundColor: '#F3F4F6' }]}>
                    {loadingMore
                      ? <ActivityIndicator size="small" color="#6B7280" />
                      : <Ionicons name="ellipsis-horizontal" size={24} color="#6B7280" />}
                  </View>
                  <Text style={styles.optionLabel}>More</Text>
                </Pressable>
              </ScrollView>
            </View>

            {/* Installed social apps row */}
            {visibleSocials.length > 0 && (
              <View style={[styles.actionsSection, { paddingBottom: insets.bottom + 16 }]}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.grid}
                >
                  {visibleSocials.map((target) => (
                    <Pressable key={target.key} style={styles.option} onPress={() => handleSocialApp(target)}>
                      <View style={[styles.iconCircle, { backgroundColor: target.bgColor }]}>
                        {target.faIcon
                          ? <FontAwesome name={target.faIcon as any} size={24} color={target.iconColor} />
                          : target.fa6Icon
                            ? <FontAwesome6 name={target.fa6Icon} size={24} color={target.iconColor} iconStyle="brand" />
                            : <Ionicons name={target.icon!} size={24} color={target.iconColor} />}
                      </View>
                      <Text style={styles.optionLabel}>{target.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    backgroundColor: WhisperColors.primaryDark,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  previewPlaceholder: {
    width: 220,
    height: 320,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  actionsSection: {
    paddingTop: 20,
  },
  grid: {
    flexDirection: 'row',
    gap: 4,
    paddingLeft: 16,
    paddingRight: 0,
  },
  option: {
    alignItems: 'center',
    gap: 8,
    width: 74,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  toast: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    zIndex: 10,
  },
  toastText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppContext } from '@/context/app-context';
import { setMessagesNotificationsEnabled } from '@/utils/exchange-api';
import { requestPermissions, setQuotesNotificationsEnabled } from '@/utils/notifications';
import { loadMessagesNotifEnabled, loadQuotesNotifEnabled } from '@/utils/storage';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useAppContext();
  const interests = state.user?.interests;

  const [quotes, setQuotes] = useState(true);
  const [messages, setMessages] = useState(true);
  const [ready, setReady] = useState(false);
  // OS-level permission. If this is off, the in-app toggles below can't actually
  // deliver anything — so we surface a notice instead of silently lying.
  const [osEnabled, setOsEnabled] = useState(true);

  const checkOsPermission = useCallback(async () => {
    const { granted } = await Notifications.getPermissionsAsync();
    setOsEnabled(granted);
  }, []);

  useEffect(() => {
    (async () => {
      const [q, m] = await Promise.all([loadQuotesNotifEnabled(), loadMessagesNotifEnabled()]);
      setQuotes(q);
      setMessages(m);
      setReady(true);
    })();
    checkOsPermission();
    // Re-check when returning from iOS Settings (they may have flipped it there).
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') checkOsPermission();
    });
    return () => sub.remove();
  }, [checkOsPermission]);

  const toggleQuotes = async (value: boolean) => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuotes(value);
    if (value) await requestPermissions();
    await setQuotesNotificationsEnabled(value, interests);
  };

  const toggleMessages = async (value: boolean) => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessages(value);
    if (value) await requestPermissions();
    await setMessagesNotificationsEnabled(value);
  };

  const renderRow = (label: string, description: string, value: boolean, onChange: (v: boolean) => void) => (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={!ready}
        trackColor={{ true: '#5A8BA8', false: '#CBD8E0' }}
        ios_backgroundColor="#CBD8E0"
      />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
          hitSlop={12}
        >
          <IconSymbol name="chevron.left" size={24} color="#3A6B80" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.list}>
        {ready && !osEnabled && (
          <Pressable style={styles.notice} onPress={() => Linking.openSettings()}>
            <IconSymbol name="bell.fill" size={18} color="#B4772E" />
            <View style={styles.noticeText}>
              <Text style={styles.noticeTitle}>Notifications are off for Whisper</Text>
              <Text style={styles.noticeBody}>
                These settings won&apos;t deliver until you turn notifications on in your iOS
                Settings. Tap to open.
              </Text>
            </View>
          </Pressable>
        )}

        {renderRow('Daily quotes', 'Gentle quote reminders through the day', quotes, toggleQuotes)}
        {renderRow(
          'Messages',
          'When a soul responds to your note, or likes what you wrote',
          messages,
          toggleMessages,
        )}
      </View>
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
  list: { paddingHorizontal: 20, gap: 10, paddingTop: 8 },
  notice: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(240, 200, 120, 0.18)',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(180, 119, 46, 0.35)',
    padding: 16,
  },
  noticeText: { flex: 1, gap: 3 },
  noticeTitle: { fontSize: 15, fontWeight: '700', color: '#8A5A1E' },
  noticeBody: { fontSize: 13, color: '#9A6B2E', lineHeight: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    padding: 16,
  },
  rowText: { flex: 1, paddingRight: 16, gap: 3 },
  rowLabel: { fontSize: 16, fontWeight: '600', color: '#3A6B80' },
  rowDesc: { fontSize: 13, color: '#7B9AAA', lineHeight: 18 },
});

import { ConstellationView } from '@/components/constellation-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Events, posthog } from '@/utils/posthog';
import { computeSignature } from '@/utils/soul-signature';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot, { captureRef } from 'react-native-view-shot';

export default function SoulSignatureScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const s = Math.max(0.85, Math.min(1, width / 390));

  const signature = useMemo(() => computeSignature(), []);
  const constellationSize = Math.min(width - 32, 360);
  const captureRefView = useRef<ViewShot>(null);

  const hasData = signature.nodes.length > 0;

  useEffect(() => {
    posthog.capture(Events.SOUL_SIGNATURE_OPENED, { has_data: hasData });
  }, []);

  const handleShare = async () => {
    posthog.capture(Events.SOUL_SIGNATURE_SHARED);
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const uri = await captureRef(captureRefView, { format: 'png', quality: 1 });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Your Soul Signature' });
      }
    } catch {
      // Silently fail; capture sometimes errors mid-animation
    }
  };

  return (
    <LinearGradient
      colors={['#0F1B2E', '#1A2A45', '#283C5C', '#3A4F70']}
      locations={[0, 0.35, 0.7, 1]}
      style={styles.gradient}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8, paddingHorizontal: 16 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerButton}>
          <IconSymbol name="chevron.left" size={24} color="rgba(255,255,255,0.9)" />
        </Pressable>
        <Text style={[styles.headerTitle, { fontSize: 16 * s }]}>Soul Signature</Text>
        <Pressable onPress={handleShare} hitSlop={12} style={styles.headerButton} disabled={!hasData}>
          <IconSymbol name="square.and.arrow.up" size={22} color={hasData ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)'} />
        </Pressable>
      </View>

      <ViewShot ref={captureRefView} options={{ format: 'png', quality: 1 }} style={styles.shotArea}>
        <LinearGradient
          colors={['#0F1B2E', '#1A2A45', '#283C5C', '#3A4F70']}
          locations={[0, 0.35, 0.7, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.shotInner}>
          <Text style={[styles.eyebrow, { fontSize: 13 * s }]}>YOUR SHAPE THIS WEEK</Text>

          <View style={{ marginTop: 20 * s, marginBottom: 20 * s }}>
            {hasData ? (
              <ConstellationView nodes={signature.nodes} size={constellationSize} />
            ) : (
              <EmptyConstellation size={constellationSize} s={s} />
            )}
          </View>

          {hasData && (
            <View style={[styles.statRow, { marginTop: 18 * s }]}>
              <Stat label="swipes" value={signature.totalSwipes} s={s} />
              <View style={styles.statDivider} />
              <Stat label="loved" value={signature.likeCount} s={s} />
              <View style={styles.statDivider} />
              <Stat label="passed" value={signature.skipCount} s={s} />
            </View>
          )}

          <Text style={[styles.footerText, { fontSize: 11 * s, marginTop: 24 * s }]}>whisper</Text>
        </View>
      </ViewShot>
    </LinearGradient>
  );
}

function Stat({ label, value, s }: { label: string; value: number; s: number }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { fontSize: 22 * s }]}>{value}</Text>
      <Text style={[styles.statLabel, { fontSize: 11 * s }]}>{label}</Text>
    </View>
  );
}

function EmptyConstellation({ size, s }: { size: number; s: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={[styles.emptyText, { fontSize: 14 * s }]}>
        Your signature appears as{'\n'}you swipe through your Daily 10.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  headerButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: 'rgba(255,255,255,0.9)', fontWeight: '600', letterSpacing: 0.4 },
  shotArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  shotInner: { alignItems: 'center', paddingHorizontal: 24, width: '100%' },
  eyebrow: {
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  },
  bigTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: undefined,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  statItem: { alignItems: 'center', paddingHorizontal: 14 },
  statValue: { color: '#FFFFFF', fontWeight: '700' },
  statLabel: { color: 'rgba(255,255,255,0.55)', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: 'rgba(255,255,255,0.18)' },
  footerText: { color: 'rgba(255,255,255,0.4)', letterSpacing: 4, textTransform: 'uppercase' },
  emptyText: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22 },
});

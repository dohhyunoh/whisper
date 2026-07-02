import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

// Shown when a writer's own words trip the crisis filter (docs §5). Their words
// never reach a peer — they reach help instead. Kept globally actionable rather
// than US-specific: findahelpline.com auto-detects the user's country and lists
// verified local helplines (~130 countries), so there's nothing to localize per
// release. The emergency-services line is the universal, offline-safe fallback.

const RESOURCES = [
  {
    label: 'Find a helpline near you',
    sub: 'Free, confidential help — wherever you are',
    url: 'https://findahelpline.com',
  },
];

export function CrisisCard({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>You don&apos;t have to hold this alone</Text>
        <Text style={styles.body}>
          It sounds like you&apos;re carrying something really heavy right now. If you&apos;re in
          immediate danger, please contact your local emergency services. To talk to someone
          trained to help, reach out below — not a stranger.
        </Text>

        <View style={styles.resourceList}>
          {RESOURCES.map((r) => (
            <Pressable
              key={r.url}
              style={({ pressed }) => [styles.resource, pressed && styles.resourcePressed]}
              onPress={() => Linking.openURL(r.url).catch(() => {})}
            >
              <Text style={styles.resourceLabel}>{r.label}</Text>
              <Text style={styles.resourceSub}>{r.sub}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(40, 60, 75, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    zIndex: 10,
  },
  card: {
    width: '100%',
    backgroundColor: '#FBFCFD',
    borderRadius: 28,
    padding: 28,
    shadowColor: '#2A4456',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#3E5C6E', textAlign: 'center' },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: '#5E7A8A',
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
  },
  resourceList: { marginTop: 22, gap: 12 },
  resource: {
    backgroundColor: '#EAF3F8',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  resourcePressed: { opacity: 0.7 },
  resourceLabel: { fontSize: 17, fontWeight: '700', color: '#4A7C97' },
  resourceSub: { fontSize: 12.5, color: '#7B9AAA', marginTop: 3, textAlign: 'center' },
  closeBtn: { marginTop: 20, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 24 },
  closeText: { fontSize: 15, fontWeight: '600', color: '#9AAEBA' },
});

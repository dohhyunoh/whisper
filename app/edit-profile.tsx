import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppContext } from '@/context/app-context';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useAppContext();

  const currentName = state.user?.name || 'Not set';
  const currentGender = state.user?.gender || 'Not set';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <IconSymbol name="chevron.left" size={24} color="#3A6B80" />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.list}>
        {/* Edit Name Row */}
        <Pressable
          style={styles.row}
          onPress={() => router.push('/edit-name')}
        >
          <View style={styles.rowLeft}>
            <IconSymbol name="pencil" size={20} color="#3A6B80" />
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>Edit Name</Text>
              <Text style={styles.rowValue}>{currentName}</Text>
            </View>
          </View>
          <IconSymbol name="chevron.right" size={18} color="#7B9AAA" />
        </Pressable>

        {/* Choose Gender Row */}
        <Pressable
          style={styles.row}
          onPress={() => router.push('/edit-gender')}
        >
          <View style={styles.rowLeft}>
            <IconSymbol name="person.fill" size={20} color="#3A6B80" />
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>Choose Gender</Text>
              <Text style={styles.rowValue}>{currentGender}</Text>
            </View>
          </View>
          <IconSymbol name="chevron.right" size={18} color="#7B9AAA" />
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
  list: {
    paddingHorizontal: 20,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    padding: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowTextContainer: {
    gap: 2,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3A6B80',
  },
  rowValue: {
    fontSize: 14,
    color: '#7B9AAA',
  },
});

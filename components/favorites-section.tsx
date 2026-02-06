import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useLikes } from '@/hooks/use-likes';
import { IconSymbol } from '@/components/ui/icon-symbol';

export function FavoritesSection() {
  const { likedIds } = useLikes();

  const handlePress = () => {
    router.push({ pathname: '/category-feed', params: { favorites: 'true' } });
  };

  if (likedIds.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconSymbol name="heart.fill" size={22} color="#E85D75" />
          <Text style={styles.title}>Favorites</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No favorites yet</Text>
          <Text style={styles.emptySubtext}>
            Tap the heart icon on quotes you love
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <View style={styles.header}>
        <IconSymbol name="heart.fill" size={22} color="#E85D75" />
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.count}>{likedIds.length}</Text>
        <IconSymbol name="chevron.right" size={18} color="#7B9AAA" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3A6B80',
    flex: 1,
  },
  count: {
    fontSize: 16,
    fontWeight: '500',
    color: '#5A8BA8',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#7B9AAA',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9BB5C5',
  },
});

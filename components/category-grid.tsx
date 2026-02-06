import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CategoryInfo } from '@/constants/categories';

interface CategoryGridProps {
  categories: CategoryInfo[];
  onPress: (category: CategoryInfo) => void;
}

export function CategoryGrid({ categories, onPress }: CategoryGridProps) {
  return (
    <View style={styles.container}>
      {categories.map((cat) => (
        <Pressable
          key={cat.key}
          style={({ pressed }) => [
            styles.pill,
            pressed && styles.pillPressed,
          ]}
          onPress={() => onPress(cat)}
        >
          <Text style={styles.label}>{cat.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(184, 217, 232, 0.4)',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  pillPressed: {
    backgroundColor: 'rgba(90, 139, 168, 0.15)',
    transform: [{ scale: 0.97 }],
  },
  emoji: {
    fontSize: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5A8BA8',
  },
});

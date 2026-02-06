import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppContext } from '@/context/app-context';

export function OwnQuotesSection() {
  const { state } = useAppContext();
  const count = state.ownQuotes.length;

  const handleAddPress = () => {
    router.push('/add-quote-modal');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconSymbol name="pencil" size={22} color="#3A6B80" />
        <Text style={styles.title}>Own Quotes</Text>
        <Text style={styles.count}>{count}</Text>
        <Pressable onPress={handleAddPress} hitSlop={12} style={styles.addButton}>
          <IconSymbol name="plus.circle.fill" size={24} color="#3A6B80" />
        </Pressable>
      </View>
    </View>
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
  addButton: {
    padding: 4,
  },
});

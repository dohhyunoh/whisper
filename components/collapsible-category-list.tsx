import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CategoryCollapsible } from '@/components/category-collapsible';
import { CATEGORIES } from '@/constants/categories';

export function CollapsibleCategoryList() {
  return (
    <View style={styles.container}>
      {CATEGORIES.map((category) => (
        <CategoryCollapsible key={category.key} category={category} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
});

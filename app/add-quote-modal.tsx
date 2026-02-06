import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppContext } from '@/context/app-context';

export default function AddQuoteModal() {
  const insets = useSafeAreaInsets();
  const { dispatch } = useAppContext();
  const [quoteText, setQuoteText] = useState('');
  const [author, setAuthor] = useState('');
  const [source, setSource] = useState('');

  const handleClose = () => {
    router.back();
  };

  const handleSave = () => {
    if (!quoteText.trim()) return;

    const newQuote = {
      id: `own-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text: quoteText.trim(),
      author: author.trim() || undefined,
      source: source.trim() || undefined,
      createdAt: Date.now(),
    };

    dispatch({ type: 'ADD_OWN_QUOTE', payload: newQuote });
    router.back();
  };

  const canSave = quoteText.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={handleClose} hitSlop={12}>
          <IconSymbol name="xmark" size={24} color="#5A8BA8" />
        </Pressable>
        <Text style={styles.headerTitle}>Add Quote</Text>
        <Pressable
          onPress={handleSave}
          hitSlop={12}
          disabled={!canSave}
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        >
          <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>Save</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Quote *</Text>
          <TextInput
            style={[styles.input, styles.quoteInput]}
            placeholder="Enter your quote..."
            placeholderTextColor="#9BB5C5"
            value={quoteText}
            onChangeText={setQuoteText}
            multiline
            textAlignVertical="top"
            autoFocus
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Author (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Who said this?"
            placeholderTextColor="#9BB5C5"
            value={author}
            onChangeText={setAuthor}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Source (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Book, movie, speech..."
            placeholderTextColor="#9BB5C5"
            value={source}
            onChangeText={setSource}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(122, 154, 170, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3A6B80',
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3A6B80',
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(58, 107, 128, 0.3)',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  saveTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5A8BA8',
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#3A6B80',
    borderWidth: 1,
    borderColor: 'rgba(122, 154, 170, 0.2)',
  },
  quoteInput: {
    minHeight: 120,
    paddingTop: 14,
  },
});

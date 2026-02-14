import { IconSymbol } from '@/components/ui/icon-symbol';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';

interface ProfileButtonProps {
  style?: StyleProp<ViewStyle>;
}

const BASE_SIZE = 44;
const BASE_SCREEN_WIDTH = 375;
const MAX_SCREEN_WIDTH = 430;

export function ProfileButton({ style }: ProfileButtonProps) {
  const { width } = useWindowDimensions();
  const scale = 1 + ((Math.min(width, MAX_SCREEN_WIDTH) - BASE_SCREEN_WIDTH) / (MAX_SCREEN_WIDTH - BASE_SCREEN_WIDTH)) * 0.3;
  const size = Math.round(BASE_SIZE * scale);

  const handlePress = () => {
    router.push('/profile-modal');
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        style,
        pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }
      ]}
      hitSlop={12}
    >
      <View style={[styles.glassContainer, { width: size, height: size, borderRadius: size / 2 }]}>
        {/* Dark material tint for the premium liquid look */}
        <BlurView 
          intensity={80} 
          tint="light" 
          style={styles.blur}
        >
          <View style={styles.iconContainer}>
            {/* Changed color to White (#FFFFFF) to contrast with dark glass */}
            <IconSymbol name="person.circle" size={26} color="#FFFFFF" />
          </View>
        </BlurView>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  glassContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    
    // LIQUID GLASS STYLES:
    backgroundColor: 'rgba(20, 20, 20, 0.3)', // Dark semi-transparent base
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.15)', // The "rim light" edge
    
    // Deep shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  blur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
import { Ionicons } from '@expo/vector-icons';
import {
  BlurMask,
  Canvas,
  Circle,
  DisplacementMap,
  Group,
  RadialGradient,
  Turbulence, // No Offset, No Mask needed
  mix,
  vec,
} from '@shopify/react-native-skia';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// ---------------------------------------------------------------------------
// 1. MOOD DATA
// ---------------------------------------------------------------------------
const moods = [
  { 
    id: 'cloudy', 
    label: 'Cloudy', 
    r: 160, g: 180, b: 200, 
    message: "Let's clear that up" 
  },
  { 
    id: 'clear', 
    label: 'Clear', 
    r: 137, g: 207, b: 240, 
    message: "Let's keep it that way" 
  },
  { 
    id: 'stormy', 
    label: 'Stormy', 
    r: 141, g: 163, b: 153, 
    message: "We're here for you" 
  },
  { 
    id: 'windy', 
    label: 'Windy', 
    r: 191, g: 166, b: 201, 
    message: "Let's find some stillness" 
  },
];

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const BUBBLE_RADIUS = 60;
const TOUCH_TARGET_SIZE = 160;
const GRID_GAP = 20;
const GRID_WIDTH = TOUCH_TARGET_SIZE * 2 + GRID_GAP;
const GRID_LEFT = (SCREEN_W - GRID_WIDTH) / 2;
const GRID_TOP = SCREEN_H * 0.35;

function getBubbleCenter(index: number) {
  const col = index % 2;
  const row = Math.floor(index / 2);
  return {
    x: GRID_LEFT + col * (TOUCH_TARGET_SIZE + GRID_GAP) + TOUCH_TARGET_SIZE / 2,
    y: GRID_TOP + row * (TOUCH_TARGET_SIZE + GRID_GAP) + TOUCH_TARGET_SIZE / 2,
  };
}

// ---------------------------------------------------------------------------
// SparkleParticle
// ---------------------------------------------------------------------------
function SparkleParticle({
  style,
  size,
  delay,
  duration,
}: {
  style: object;
  size: number;
  delay: number;
  duration: number;
}) {
  const opacity = useSharedValue(0.1);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.6, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute' as const,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#FFFFFF',
        },
        style,
        animatedStyle,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// SkiaBubble - STATIC & CONTAINED (No Masks, No Animation)
// ---------------------------------------------------------------------------
function SkiaBubble({
  mood,
  index,
  selectedIndex,
  expansionProgress,
  breathing,
}: {
  mood: (typeof moods)[0];
  index: number;
  selectedIndex: SharedValue<number>;
  expansionProgress: SharedValue<number>;
  breathing: SharedValue<number>;
}) {
  const center = getBubbleCenter(index);

  // 1. Radius Logic
  const r = useDerivedValue(() => {
    if (selectedIndex.value === index) {
      return mix(expansionProgress.value, BUBBLE_RADIUS, SCREEN_H * 1.2);
    }
    if (selectedIndex.value !== -1) {
      return mix(expansionProgress.value, BUBBLE_RADIUS, 0);
    }
    return mix(breathing.value, BUBBLE_RADIUS, BUBBLE_RADIUS + 5);
  });

  // 2. Position Logic
  const cx = useDerivedValue(() => {
    if (selectedIndex.value === index) {
      return mix(expansionProgress.value, center.x, SCREEN_W / 2);
    }
    return center.x;
  });

  const cy = useDerivedValue(() => {
    if (selectedIndex.value === index) {
      return mix(expansionProgress.value, center.y, SCREEN_H / 2);
    }
    return center.y;
  });

  const gradientCenter = useDerivedValue(() => vec(cx.value, cy.value));

  return (
    <Group>
      {/* LAYER 1: The Cloud (Static) */}
      <Circle cx={cx} cy={cy} r={r}>
        
        {/* DISPLACEMENT MAP: Warps the shape statically */}
        {/* We removed <Offset> so it doesn't move */}
        <DisplacementMap channelX="a" channelY="a" scale={15}>
            <Turbulence 
              freqX={0.03} 
              freqY={0.03} 
              octaves={4} 
              seed={index} 
            />
        </DisplacementMap>

        <RadialGradient
          c={gradientCenter}
          r={r}
          colors={[
            `rgba(${mood.r},${mood.g},${mood.b}, 0.8)`, // Center: Strong color
            `rgba(${mood.r},${mood.g},${mood.b}, 0.2)`, // Mid: Faint
            `rgba(${mood.r},${mood.g},${mood.b}, 0.0)`, // Edge: Transparent
          ]}
          // FIXED: We fade to transparent at 0.9 instead of 1.0.
          // This creates a "safety buffer" so the distorted pixels don't spill outside.
          positions={[0.0, 0.6, 0.9]} 
        />
        <BlurMask blur={10} style="normal" />
      </Circle>

      {/* LAYER 2: The Glass Rim (Drawn on top) */}
      <Circle 
        cx={cx} 
        cy={cy} 
        r={r}
        style="stroke" 
        strokeWidth={1.5} 
        color={`rgba(${mood.r},${mood.g},${mood.b}, 0.5)`} 
      >
        <BlurMask blur={2} style="normal" />
      </Circle>
    </Group>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function OnboardingScreen() {
  const router = useRouter();

  // ---- shared animation values ----
  const selectedIndex = useSharedValue(-1);
  const expansionProgress = useSharedValue(0);
  const breathing = useSharedValue(0);

  const questionOpacity = useSharedValue(1);
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(20);
  const logoScale = useSharedValue(0.85);
  const cloudY = useSharedValue(0);
  const btnOpacity = useSharedValue(0);

  const [moodMessage, setMoodMessage] = useState('');

  // Breathing loop
  useEffect(() => {
    breathing.value = withRepeat(
      withTiming(1, { duration: 3500, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, []);

  // ---- selection handler ----
  const handleSelect = useCallback((index: number) => {
    if (selectedIndex.value >= 0) return;
    selectedIndex.value = index;
    setMoodMessage(moods[index].message);

    // Expand
    expansionProgress.value = withTiming(1, {
      duration: 800,
      easing: Easing.inOut(Easing.cubic),
    });

    // Fade UI
    questionOpacity.value = withTiming(0, { duration: 400 });

    // Logo Reveal
    logoOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
    logoTranslateY.value = withDelay(800, withSpring(0, { damping: 14, mass: 0.8 }));
    logoScale.value = withDelay(800, withSpring(1, { damping: 12, mass: 0.7 }));

    // Cloud Float
    cloudY.value = withDelay(
      1100,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      ),
    );

    // Button
    btnOpacity.value = withDelay(1400, withTiming(1, { duration: 600 }));
  }, []);

  // ---- Styles ----
  const questionStyle = useAnimatedStyle(() => ({ opacity: questionOpacity.value }));
  const logoContainerStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }, { scale: logoScale.value }],
  }));
  const cloudStyle = useAnimatedStyle(() => ({ transform: [{ translateY: cloudY.value }] }));
  const btnStyle = useAnimatedStyle(() => ({ opacity: btnOpacity.value }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Canvas style={StyleSheet.absoluteFill}>
        {moods.map((mood, index) => (
          <SkiaBubble
            key={mood.id}
            mood={mood}
            index={index}
            selectedIndex={selectedIndex}
            expansionProgress={expansionProgress}
            breathing={breathing}
          />
        ))}
      </Canvas>

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <SparkleParticle style={{ top: '15%', left: '20%' }} size={8} delay={0} duration={3000} />
        <SparkleParticle style={{ top: '25%', right: '25%' }} size={6} delay={1000} duration={4000} />
        <SparkleParticle style={{ top: '60%', left: '15%' }} size={4} delay={2000} duration={3500} />
        <SparkleParticle style={{ top: '70%', right: '30%' }} size={6} delay={500} duration={4000} />
        <SparkleParticle style={{ top: '40%', right: '15%' }} size={4} delay={1500} duration={3000} />
      </View>

      <Animated.View style={[styles.questionContainer, { top: GRID_TOP - 80 }, questionStyle]} pointerEvents="none">
        <Text style={styles.questionText}>How does your mind feel?</Text>
      </Animated.View>

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {moods.map((mood, index) => {
          const center = getBubbleCenter(index);
          return (
            <Pressable
              key={mood.id}
              style={[styles.touchTarget, { left: center.x - TOUCH_TARGET_SIZE / 2, top: center.y - TOUCH_TARGET_SIZE / 2 }]}
              onPress={() => handleSelect(index)}
            >
              <Animated.Text style={[styles.label, questionStyle]}>{mood.label}</Animated.Text>
            </Pressable>
          );
        })}
      </View>

      <Animated.View style={[styles.logoContainer, logoContainerStyle]} pointerEvents="none">
        <Animated.View style={cloudStyle}>
          <Ionicons name="cloud" size={52} color="rgba(255,255,255,0.9)" />
        </Animated.View>
        <Text style={styles.logoTitle}>Whisper</Text>
        <Text style={styles.logoMessage}>{moodMessage}</Text>
      </Animated.View>

      <Animated.View style={[styles.buttonWrapper, btnStyle]}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => router.push('/onboarding/name-input')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  questionContainer: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  questionText: { fontSize: 24, fontWeight: '300', color: '#5A8BA8' },
  touchTarget: { position: 'absolute', width: TOUCH_TARGET_SIZE, height: TOUCH_TARGET_SIZE, alignItems: 'center', justifyContent: 'center' },
  label: { marginTop: 80, fontSize: 16, fontWeight: '500', color: '#64748b', letterSpacing: 0.5 },
  logoContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 12 },
  logoTitle: { fontSize: 52, fontWeight: '300', color: '#FFFFFF', letterSpacing: 2 },
  logoMessage: { fontSize: 18, fontWeight: '400', color: 'rgba(255,255,255,0.9)' },
  buttonWrapper: { position: 'absolute', bottom: 80, left: 32, right: 32 },
  button: { width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 100, borderWidth: 2, borderColor: 'rgba(184, 217, 232, 0.4)', paddingVertical: 22, paddingHorizontal: 40, alignItems: 'center', shadowColor: '#5A8BA8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12 },
  buttonPressed: { transform: [{ translateY: 2 }] },
  buttonText: { fontSize: 20, fontWeight: '700', color: '#5A8BA8', letterSpacing: 0.5 },
});
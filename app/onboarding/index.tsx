import BorderSvg from '@/assets/svg/index/BorderSvg';
import Cloud1Svg from '@/assets/svg/index/Cloud1Svg';
import Cloud2Svg from '@/assets/svg/index/Cloud2Svg';
import Flower2Svg from '@/assets/svg/index/Flower2Svg';
import Flower3Svg from '@/assets/svg/index/Flower3Svg';
import FlowerSvg from '@/assets/svg/index/FlowerSvg';
import WreathSvg from '@/assets/svg/index/WreathSvg';
import { useAppContext } from '@/context/app-context';
import { defaultUserData } from '@/data/types';
import { Events, posthog } from '@/utils/posthog';
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
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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
// Base sizes at iPhone 14 (390×844)
const BASE_BUBBLE_RADIUS = 60;
const BASE_TOUCH_TARGET = 160;
const BASE_GRID_GAP = 20;

function getScale(screenW: number, screenH: number) {
  return Math.max(0.85, Math.min(1, Math.min(screenW / 390, screenH / 844)));
}

function getBubbleCenter(index: number, screenW: number, screenH: number) {
  const s = getScale(screenW, screenH);
  const touchTarget = BASE_TOUCH_TARGET * s;
  const gridGap = BASE_GRID_GAP * s;
  const gridWidth = touchTarget * 2 + gridGap;
  const gridLeft = (screenW - gridWidth) / 2;
  const gridTop = screenH * 0.35;
  const col = index % 2;
  const row = Math.floor(index / 2);
  return {
    x: gridLeft + col * (touchTarget + gridGap) + touchTarget / 2,
    y: gridTop + row * (touchTarget + gridGap) + touchTarget / 2,
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
  screenW,
  screenH,
}: {
  mood: (typeof moods)[0];
  index: number;
  selectedIndex: SharedValue<number>;
  expansionProgress: SharedValue<number>;
  breathing: SharedValue<number>;
  screenW: number;
  screenH: number;
}) {
  const center = getBubbleCenter(index, screenW, screenH);
  const bubbleRadius = BASE_BUBBLE_RADIUS * getScale(screenW, screenH);

  // 1. Radius Logic
  const r = useDerivedValue(() => {
    if (selectedIndex.value === index) {
      return mix(expansionProgress.value, bubbleRadius, screenH * 1.2);
    }
    if (selectedIndex.value !== -1) {
      return mix(expansionProgress.value, bubbleRadius, 0);
    }
    return mix(breathing.value, bubbleRadius, bubbleRadius + 5);
  });

  // 2. Position Logic
  const cx = useDerivedValue(() => {
    if (selectedIndex.value === index) {
      return mix(expansionProgress.value, center.x, screenW / 2);
    }
    return center.x;
  });

  const cy = useDerivedValue(() => {
    if (selectedIndex.value === index) {
      return mix(expansionProgress.value, center.y, screenH / 2);
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
  const { state, dispatch } = useAppContext();
  const { width: screenW, height: screenH } = useWindowDimensions();

  const s = useMemo(() => getScale(screenW, screenH), [screenW, screenH]);
  const touchTarget = BASE_TOUCH_TARGET * s;
  const gridTop = useMemo(() => screenH * 0.35, [screenH]);
  const bubbleCenters = useMemo(
    () => moods.map((_, i) => getBubbleCenter(i, screenW, screenH)),
    [screenW, screenH],
  );

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
  const decorOpacity = useSharedValue(0);

  const [moodMessage, setMoodMessage] = useState('');

  useEffect(() => {
    posthog.capture(Events.ONBOARDING_SCREEN_VIEWED, { screen_name: 'welcome' });
  }, []);

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
    posthog.capture(Events.ONBOARDING_CHOICE_MADE, { screen: 'welcome', choice: moods[index].label });

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

    // Decorations
    decorOpacity.value = withDelay(900, withTiming(1, { duration: 700 }));
  }, []);

  // ---- Styles ----
  const questionStyle = useAnimatedStyle(() => ({ opacity: questionOpacity.value }));
  const logoContainerStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }, { scale: logoScale.value }],
  }));
  const cloudStyle = useAnimatedStyle(() => ({ transform: [{ translateY: cloudY.value }] }));
  const btnStyle = useAnimatedStyle(() => ({ opacity: btnOpacity.value }));
  const decorStyle = useAnimatedStyle(() => ({ opacity: decorOpacity.value }));

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
            screenW={screenW}
            screenH={screenH}
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

      <Animated.View style={[styles.questionContainer, { top: gridTop - 80 * s }, questionStyle]} pointerEvents="none">
        <Text style={[styles.questionText, { fontSize: 24 * s }]}>How does your mind feel?</Text>
      </Animated.View>

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {moods.map((mood, index) => {
          const center = bubbleCenters[index];
          return (
            <Pressable
              key={mood.id}
              style={[styles.touchTarget, { width: touchTarget, height: touchTarget, left: center.x - touchTarget / 2, top: center.y - touchTarget / 2 }]}
              onPress={() => {
                if (process.env.EXPO_OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                handleSelect(index);
              }}
            >
              <Animated.Text style={[styles.label, { marginTop: 80 * s, fontSize: 15 * s }, questionStyle]}>{mood.label}</Animated.Text>
            </Pressable>
          );
        })}
      </View>

      <Animated.View style={[styles.logoContainer, logoContainerStyle]} pointerEvents="none">
        <View style={styles.wreathContainer}>
          <WreathSvg size={220 * s} color="rgba(255,255,255,0.9)" />
          <Animated.View style={[styles.mascotOverlay, cloudStyle]}>
            <Image source={require('@/assets/images/mascot.png')} style={{ width: 52 * s, height: 52 * s }} resizeMode="contain" />
          </Animated.View>
        </View>
        <Text style={styles.logoTitle}>Whisper</Text>
        <Text style={styles.logoMessage}>{moodMessage}</Text>
      </Animated.View>

      {/* All decorations — fade in after bubble tap */}
      <Animated.View style={[StyleSheet.absoluteFill, decorStyle]} pointerEvents="none">
        {/* Corner borders — top-left of left at (1,1), top-right of right at (9,1) */}
        <View style={[styles.decor, { top: screenH * (1 / 20), left: screenW * (0.5 / 10), transform: [{ rotate: '180deg' }, { scaleX: -1 }] }]}>
          <BorderSvg size={110 * s} color="rgba(255,255,255,0.7)" />
        </View>
        <View style={[styles.decor, { top: screenH * (1 / 20), left: screenW * (9.5 / 10) - 110 * s, transform: [{ rotate: '180deg' }] }]}>
          <BorderSvg size={110 * s} color="rgba(255,255,255,0.7)" />
        </View>

        {/* Clouds — upper area */}
        <View style={[styles.decor, { top: 200 * s, left: 20 * s }]}>
          <Cloud1Svg size={80 * s} color="rgba(255,255,255,0.8)" />
        </View>
        <View style={[styles.decor, { top: 100 * s, left: screenW * 0.28 }]}>
          <Cloud2Svg size={140 * s} color="rgba(255,255,255,0.8)" />
        </View>

        {/* Daisy flower — top right, bottom edge at (8, 6) */}
        <View style={[styles.decor, { bottom: screenH * (1 - 6 / 20), left: screenW * (8 / 10) - 50 * s }]}>
          <Flower2Svg size={100 * s} color="rgba(255,255,255,0.8)" />
        </View>

        {/* Bottom-left flower — bottom edge centered at (2.5, 17) */}
        <View style={[styles.decor, { bottom: screenH * (1 - 17.5 / 20), left: screenW * (1.5 / 10) - 110 * s }]}>
          <FlowerSvg size={200 * s} color="rgba(255,255,255,0.85)" />
        </View>

        {/* Bottom-right flower — bottom edge centered at (7.5, 17) */}
        <View style={[styles.decor, { bottom: screenH * (1 - 17.5 / 20), left: screenW * (7.5 / 10) - 75 * s }]}>
          <Flower3Svg size={130 * s} color="rgba(255,255,255,0.8)" />
        </View>
      </Animated.View>

      {/* Button */}
      <Animated.View style={[styles.buttonWrapper, { bottom: 80 * s, left: 32 * s, right: 32 * s }, btnStyle]}>
        <Pressable
          style={({ pressed }) => [styles.button, { paddingVertical: 18 * s, paddingHorizontal: 40 * s }, pressed && styles.buttonPressed]}
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            const selectedMood = moods[selectedIndex.value];
            if (selectedMood) {
              dispatch({
                type: 'SET_USER',
                payload: { ...defaultUserData, ...state.user, weatherMood: selectedMood.label },
              });
            }
            posthog.capture(Events.ONBOARDING_STARTED);
            router.push('/onboarding/name-input');
          }}
        >
          <Text style={[styles.buttonText, { fontSize: 18 * s }]}>Get Started</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  questionContainer: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  questionText: { fontWeight: '300', color: '#5A8BA8' },
  touchTarget: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: '500', color: '#64748b', letterSpacing: 0.5 },
  logoContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 12 },
  wreathContainer: { alignItems: 'center', justifyContent: 'center' },
  mascotOverlay: { position: 'absolute', alignItems: 'center', justifyContent: 'center', top: 0, left: 0, right: 0, bottom: 0 },
  decor: { position: 'absolute' },
  logoTitle: { fontSize: 52, fontWeight: '300', color: '#FFFFFF', letterSpacing: 2 },
  logoMessage: { fontSize: 18, fontWeight: '400', color: 'rgba(255,255,255,0.9)' },
  buttonWrapper: { position: 'absolute' },
  button: { width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 100, borderWidth: 2, borderColor: 'rgba(184, 217, 232, 0.4)', alignItems: 'center', shadowColor: '#5A8BA8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12 },
  buttonPressed: { transform: [{ translateY: 2 }] },
  buttonText: { fontWeight: '700', color: '#5A8BA8', letterSpacing: 0.5 },
});
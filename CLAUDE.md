# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npx expo start       # Start development server (press i for iOS, a for Android)
npx expo start --ios # Start directly on iOS simulator
npm run lint         # Run ESLint
npx tsc --noEmit     # Type check without emitting
```

## Architecture

**Whisper** is a React Native quotes app built with Expo SDK 54 and expo-router for file-based navigation.

### Navigation Flow
- `app/index.tsx` - Entry point that redirects to `/onboarding` or `/home` based on `onboardingComplete` state
- `app/onboarding/` - Multi-step onboarding flow (name → gender → interests → stuck → reveal → notifications)
- `app/home.tsx` - Main feed showing vertical swipeable quote cards
- `app/category-feed.tsx` - Modal for browsing quotes by category/subcategory
- `app/profile-modal.tsx` - User profile with favorites, appearance settings, and category browsing
- `app/premium-modal.tsx` - Premium upgrade screen with theme/font selection

### State Management
- `context/app-context.tsx` - Single React Context providing global state via `useReducer`
- State includes: `user`, `onboardingComplete`, `likedIds`, `premium`, `hydrated`
- All state persisted to AsyncStorage via `utils/storage.ts`
- Hydration happens on mount; components check `state.hydrated` before rendering

### Premium System
- `constants/premium.ts` - Theme definitions (7 background themes) and font options (5 fonts including shuffle)
- `utils/premium-check.ts` - Early bird grandfathering logic via `IS_EARLY_BIRD_RELEASE` flag
- `hooks/use-premium.ts` - Hook exposing `isPremium`, `currentTheme`, `currentFont`, setters
- Premium fonts loaded in `app/_layout.tsx` using `@expo-google-fonts/*` packages

### Data Layer
- `data/quotes.json` - Quote database with categories: philosophy, religion, movies, anime, relationships, health, grinders
- `data/types.ts` - TypeScript types for Quote, Category, UserData, PremiumState, AppAction
- Quotes have optional `subcategory` and `spiritualLens` fields for filtering

### Key Patterns
- Category gradients defined in `constants/categories.ts` (4-color arrays for LinearGradient)
- Quote card theming: uses premium theme colors or falls back to category-specific gradients when theme is 'default'
- Font shuffle mode: deterministically picks font per quote using `quote.id` hash
- Storage keys prefixed with `@whisper_` in AsyncStorage

### Path Aliases
`@/` maps to project root (configured in tsconfig.json)

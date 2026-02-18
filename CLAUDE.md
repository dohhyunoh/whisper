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
- `app/onboarding/` - Multi-step onboarding flow (see Onboarding section below)
- `app/home.tsx` - Main feed showing vertical swipeable quote cards
- `app/category-feed.tsx` - Modal for browsing quotes by category/subcategory
- `app/profile-modal.tsx` - User profile with favorites, appearance settings, and category browsing
- `app/premium-modal.tsx` - Premium upgrade screen with theme/font selection

### Onboarding Flow (20 screens, 6 acts)

The onboarding is designed as an emotional narrative arc. Each act builds on the previous one to make the user understand why they need the app.

**ACT 1: Who are you** (safe, low friction)
1. `index` → Weather mood bubbles (Skia animated) → saves `weatherMood`
2. `name-input` → Free text → saves `name`
3. `gender-selection` → saves `gender`

**ACT 2: What's your world** (life context before emotions)
4. `heart-check` → "Who is holding your heart?" → saves `heartStatus` → branches: "My family/friends" skips to faith-base
5. `heart-detail` → Adapts to `heartStatus` → saves `heartDetail`
6. `faith-base` → "Where do you look for light?" (Up/In/Out/Around) → saves `lightSource` → branches: "Up" goes to faith-detail, others skip to identity-role
7. `faith-detail` → Adapts to `lightSource` → saves `faithDetail`
8. `identity-role` → "Which role weighs heaviest?" → saves `heaviestRole`

**ACT 3: How is that affecting you** (internal, emotional deep dive)
9. `primary-emotion` → "If your heart could speak one word..." → saves `primaryEmotion`
10. `emotion-root` → Adapts to `primaryEmotion` (multi-select) → saves `emotionRoot`
11. `body-check` → "Where are you carrying this?" → saves `bodyCarry`
12. `narrative` → "What story plays on loop?" (multi-select) → saves `narrative`

**ACT 4: What do you need** (reveals why they need the app)
13. `what-helps` → "What helps you feel like yourself again?" → saves `whatHelps` (Encouragement/Wisdom/Compassion/Understanding/Stillness)
14. `words-shape` → "Do you believe words can change how you think — and how you live?" → saves `wordsShape`
15. `quote-ritual` → "When words speak to you, what do you do?" → saves `quoteRitual`

**ACT 5: The bridge** (commitment + customization)
16. `app-expect` → "What do you want Whisper to be for you?" → saves `appExpect`
17. `tone-preference` → "How should we speak to you?" → saves `tonePreference`

**ACT 6: Delivery**
18. `curating` → Loading screen that runs `deriveInterests()` mapping all user answers to quote categories
19. `notification-preview` → Notification scheduling (uses `state.user.interests`)
20. `paywall` → Premium upsell

**Key onboarding patterns:**
- All screens use `OnboardingLayout` component (`components/onboarding-layout.tsx`) for consistent styling and iPhone scalability
- Scale factor `s` is computed from screen dimensions (base: iPhone 14 390×844) for all sizes
- Every screen tracks `posthog.capture(Events.ONBOARDING_SCREEN_VIEWED)` and `Events.ONBOARDING_CHOICE_MADE`
- State saved via `dispatch({ type: 'SET_USER', payload: { ...defaultUserData, ...state.user, field: value } })`
- Every screen has a Skip button that navigates forward without saving
- Adaptive screens read previous answers from `state.user.*`

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
- `data/quotes/` - Quote JSON files organized by `category-subcategory.json` (e.g. `mood-calm.json`, `religion-christianity.json`)
- `data/quotes/index.ts` - Aggregates all quote files into a single array
- `data/types.ts` - TypeScript types for Quote, Category, UserData, PremiumState, AppAction
- Categories: `self-love`, `relationships`, `empowerment`, `religion`, `mood-boosters`
- Quotes have optional `subcategory` and `tone` fields for filtering

### Key Patterns
- Category gradients defined in `constants/categories.ts` (4-color arrays for LinearGradient)
- Quote card theming: uses premium theme colors or falls back to category-specific gradients when theme is 'default'
- Font shuffle mode: deterministically picks font per quote using `quote.id` hash
- Storage keys prefixed with `@whisper_` in AsyncStorage
- Analytics via PostHog (`utils/posthog.ts`) — events defined in `Events` object

### Path Aliases
`@/` maps to project root (configured in tsconfig.json)

## Subagent Strategy

When using Claude Code's Task tool for parallel work, split by domain:

### 1. Onboarding Agent
**Scope:** `app/onboarding/`, `components/onboarding-layout.tsx`
- Adding/modifying onboarding screens
- Updating navigation routes between screens
- Updating `_layout.tsx` stack order
- Must follow the OnboardingLayout pattern and posthog tracking conventions

### 2. Data / Quotes Agent
**Scope:** `data/`, `hooks/use-quotes.ts`
- Adding/editing quote JSON files
- Updating `data/quotes/index.ts` to include new files
- Updating `data/types.ts` for new categories/subcategories
- Updating `deriveInterests()` in `app/onboarding/curating.tsx` when quote categories change

### 3. UI / Features Agent
**Scope:** `app/home.tsx`, `app/category-feed.tsx`, `app/profile-modal.tsx`, `app/premium-modal.tsx`, `components/`, `constants/`
- Home feed, quote cards, modals
- Premium system (themes, fonts)
- Category browsing and filtering

### Cross-cutting concerns (touch multiple domains):
- `data/types.ts` — shared by all agents (UserData, Quote, AppState)
- `context/app-context.tsx` — state management (reducer actions)
- `utils/posthog.ts` — analytics events
- When multiple agents need to edit the same file, run them sequentially, not in parallel

import { DEFAULT_PREMIUM_SETTINGS, REVENUECAT_ENTITLEMENT_ID } from '@/constants/premium';
import { AppAction, AppState, PremiumState } from '@/data/types';
import { initializePremiumStatus } from '@/utils/premium-check';
import {
    loadLikedIds,
    loadOnboardingComplete,
    loadOwnQuotes,
    loadStreakDates,
    loadUser,
    saveLikedIds,
    saveOnboardingComplete,
    saveOwnQuotes,
    savePremiumSettings,
    savePremiumStatus,
    saveStreakDates,
    saveUser,
} from '@/utils/storage';
import { syncWidgetData } from '@/utils/widget-data';
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { AppState as RNAppState } from 'react-native';
import Purchases from 'react-native-purchases';

const defaultPremiumState: PremiumState = {
  status: 'standard_free',
  settings: DEFAULT_PREMIUM_SETTINGS,
};

const initialState: AppState = {
  user: null,
  onboardingComplete: false,
  likedIds: [],
  ownQuotes: [],
  streakDates: [],
  hydrated: false,
  premium: defaultPremiumState,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'COMPLETE_ONBOARDING':
      return { ...state, onboardingComplete: true };
    case 'TOGGLE_LIKE': {
      const id = action.payload;
      const liked = state.likedIds.includes(id);
      return {
        ...state,
        likedIds: liked
          ? state.likedIds.filter((x) => x !== id)
          : [...state.likedIds, id],
      };
    }
    case 'HYDRATE':
      return {
        ...state,
        user: action.payload.user,
        onboardingComplete: action.payload.onboardingComplete,
        likedIds: action.payload.likedIds,
        ownQuotes: action.payload.ownQuotes,
        streakDates: action.payload.streakDates,
        premium: action.payload.premium,
        hydrated: true,
      };
    case 'SET_PREMIUM_STATUS':
      return {
        ...state,
        premium: {
          ...state.premium,
          status: action.payload,
        },
      };
    case 'SET_PREMIUM_FONT':
      return {
        ...state,
        premium: {
          ...state.premium,
          settings: {
            ...state.premium.settings,
            selectedFont: action.payload,
          },
        },
      };
    case 'SET_PREMIUM_BACKGROUND':
      return {
        ...state,
        premium: {
          ...state.premium,
          settings: {
            ...state.premium.settings,
            selectedBackground: action.payload,
          },
        },
      };
    case 'ADD_OWN_QUOTE':
      return {
        ...state,
        ownQuotes: [action.payload, ...state.ownQuotes],
      };
    case 'EDIT_OWN_QUOTE':
      return {
        ...state,
        ownQuotes: state.ownQuotes.map((q) => q.id === action.payload.id ? action.payload : q),
      };
    case 'REMOVE_OWN_QUOTE':
      return {
        ...state,
        ownQuotes: state.ownQuotes.filter((q) => q.id !== action.payload),
      };
    case 'RECORD_DAILY_OPEN': {
      const dateStr = action.payload;
      if (state.streakDates.includes(dateStr)) return state;
      return { ...state, streakDates: [...state.streakDates, dateStr] };
    }
    case 'SET_CUSTOM_PHOTO':
      return {
        ...state,
        premium: {
          ...state.premium,
          settings: {
            ...state.premium.settings,
            customPhotoUri: action.payload,
            selectedBackground: 'custom-photo-0' as any,
          },
        },
      };
    case 'ADD_CUSTOM_PHOTO': {
      const uris = [action.payload, ...(state.premium.settings.customPhotoUris ?? [])];
      return {
        ...state,
        premium: {
          ...state.premium,
          settings: {
            ...state.premium.settings,
            customPhotoUris: uris,
            selectedBackground: `custom-photo-0` as any,
          },
        },
      };
    }
    case 'REMOVE_CUSTOM_PHOTO': {
      const uris = [...(state.premium.settings.customPhotoUris ?? [])];
      uris.splice(action.payload, 1);
      const currentBg = state.premium.settings.selectedBackground;
      // If the removed photo was selected, reset to default
      let newBg = currentBg;
      if (currentBg === `custom-photo-${action.payload}`) {
        newBg = 'default';
      } else if (currentBg.startsWith('custom-photo-')) {
        // Adjust index if a photo before the current one was removed
        const currentIdx = parseInt(currentBg.replace('custom-photo-', ''), 10);
        if (currentIdx > action.payload) {
          newBg = `custom-photo-${currentIdx - 1}` as any;
        }
      }
      return {
        ...state,
        premium: {
          ...state.premium,
          settings: {
            ...state.premium.settings,
            customPhotoUris: uris,
            selectedBackground: newBg,
          },
        },
      };
    }
    case 'SET_SHUFFLE_POOLS':
      return {
        ...state,
        premium: {
          ...state.premium,
          settings: {
            ...state.premium.settings,
            shufflePools: action.payload.pools,
            activeShuffleIndex: action.payload.activeIndex,
            selectedBackground: 'shuffle',
          },
        },
      };
    case 'SET_FONT_SHUFFLE_POOL':
      return {
        ...state,
        premium: {
          ...state.premium,
          settings: {
            ...state.premium.settings,
            fontShufflePool: action.payload,
          },
        },
      };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue>({
  state: initialState,
  dispatch: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      const [user, onboardingComplete, likedIds, ownQuotes, streakDates, premium] = await Promise.all([
        loadUser(),
        loadOnboardingComplete(),
        loadLikedIds(),
        loadOwnQuotes(),
        loadStreakDates(),
        initializePremiumStatus(),
      ]);
      dispatch({ type: 'HYDRATE', payload: { user, onboardingComplete, likedIds, ownQuotes, streakDates, premium } });
    })();
  }, []);

  // Persist user changes
  useEffect(() => {
    if (!state.hydrated) return;
    if (state.user) {
      saveUser(state.user);
    }
  }, [state.user, state.hydrated]);

  // Persist onboarding state
  useEffect(() => {
    if (!state.hydrated) return;
    saveOnboardingComplete(state.onboardingComplete);
  }, [state.onboardingComplete, state.hydrated]);

  // Persist liked IDs
  useEffect(() => {
    if (!state.hydrated) return;
    saveLikedIds(state.likedIds);
  }, [state.likedIds, state.hydrated]);

  // Persist own quotes
  useEffect(() => {
    if (!state.hydrated) return;
    saveOwnQuotes(state.ownQuotes);
  }, [state.ownQuotes, state.hydrated]);

  // Persist streak dates
  useEffect(() => {
    if (!state.hydrated) return;
    saveStreakDates(state.streakDates);
  }, [state.streakDates, state.hydrated]);

  // Listen for RevenueCat customer info changes (handles expiry while app is open)
  useEffect(() => {
    if (!state.hydrated) return;
    const listener = (info: any) => {
      const hasEntitlement = info.entitlements.active[REVENUECAT_ENTITLEMENT_ID] !== undefined;
      dispatch({ type: 'SET_PREMIUM_STATUS', payload: hasEntitlement ? 'premium_purchased' : 'standard_free' });
    };
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => { Purchases.removeCustomerInfoUpdateListener(listener); };
  }, [state.hydrated, dispatch]);

  // Re-check entitlement when app comes back to foreground
  useEffect(() => {
    if (!state.hydrated) return;
    const sub = RNAppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        try {
          const info = await Purchases.getCustomerInfo();
          const hasEntitlement = info.entitlements.active[REVENUECAT_ENTITLEMENT_ID] !== undefined;
          dispatch({ type: 'SET_PREMIUM_STATUS', payload: hasEntitlement ? 'premium_purchased' : 'standard_free' });
        } catch {
          // Silently fail
        }
      }
    });
    return () => sub.remove();
  }, [state.hydrated, dispatch]);

  // Persist premium status
  useEffect(() => {
    if (!state.hydrated) return;
    savePremiumStatus(state.premium.status);
  }, [state.premium.status, state.hydrated]);

  // Persist premium settings
  useEffect(() => {
    if (!state.hydrated) return;
    savePremiumSettings(state.premium.settings);
  }, [state.premium.settings, state.hydrated]);

  // Sync widget data when quotes, likes, or category preferences change
  const userInterests = state.user?.interests;
  useEffect(() => {
    if (!state.hydrated || !state.onboardingComplete) return;
    syncWidgetData(state.likedIds, state.ownQuotes, userInterests ?? []);
  }, [state.hydrated, state.onboardingComplete, state.likedIds, state.ownQuotes, userInterests]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}

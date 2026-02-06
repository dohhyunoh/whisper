import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { AppAction, AppState, PremiumState, UserData } from '@/data/types';
import { DEFAULT_PREMIUM_SETTINGS } from '@/constants/premium';
import {
  loadLikedIds,
  loadOnboardingComplete,
  loadOwnQuotes,
  loadUser,
  saveLikedIds,
  saveOnboardingComplete,
  saveOwnQuotes,
  savePremiumSettings,
  savePremiumStatus,
  saveUser,
} from '@/utils/storage';
import { initializePremiumStatus } from '@/utils/premium-check';

const defaultPremiumState: PremiumState = {
  status: 'standard_free',
  settings: DEFAULT_PREMIUM_SETTINGS,
};

const initialState: AppState = {
  user: null,
  onboardingComplete: false,
  likedIds: [],
  ownQuotes: [],
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
        ownQuotes: [...state.ownQuotes, action.payload],
      };
    case 'REMOVE_OWN_QUOTE':
      return {
        ...state,
        ownQuotes: state.ownQuotes.filter((q) => q.id !== action.payload),
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
      const [user, onboardingComplete, likedIds, ownQuotes, premium] = await Promise.all([
        loadUser(),
        loadOnboardingComplete(),
        loadLikedIds(),
        loadOwnQuotes(),
        initializePremiumStatus(),
      ]);
      dispatch({ type: 'HYDRATE', payload: { user, onboardingComplete, likedIds, ownQuotes, premium } });
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

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}

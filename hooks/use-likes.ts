import * as StoreReview from 'expo-store-review';
import { useCallback } from 'react';
import { useAppContext } from '@/context/app-context';
import { hasRequestedReview, markReviewRequested } from '@/utils/storage';

export function useLikes() {
  const { state, dispatch } = useAppContext();

  const isLiked = useCallback(
    (id: string) => state.likedIds.includes(id),
    [state.likedIds],
  );

  const toggleLike = useCallback(
    (id: string) => {
      const willLike = !state.likedIds.includes(id);

      dispatch({ type: 'TOGGLE_LIKE', payload: id });

      // Ask for a store rating once, the first time the user likes a quote
      // (a moment of genuine engagement, not during onboarding). The flag is
      // unset for everyone — including existing users — so the first like
      // after this update triggers it, then never again.
      if (willLike) {
        setTimeout(async () => {
          if (await hasRequestedReview()) return;
          if (await StoreReview.hasAction()) {
            await StoreReview.requestReview();
            await markReviewRequested();
          }
        }, 500);
      }
    },
    [dispatch, state.likedIds],
  );

  return { likedIds: state.likedIds, isLiked, toggleLike };
}

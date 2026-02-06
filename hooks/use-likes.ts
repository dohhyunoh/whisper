import { useCallback } from 'react';
import { useAppContext } from '@/context/app-context';

export function useLikes() {
  const { state, dispatch } = useAppContext();

  const isLiked = useCallback(
    (id: string) => state.likedIds.includes(id),
    [state.likedIds],
  );

  const toggleLike = useCallback(
    (id: string) => dispatch({ type: 'TOGGLE_LIKE', payload: id }),
    [dispatch],
  );

  return { likedIds: state.likedIds, isLiked, toggleLike };
}

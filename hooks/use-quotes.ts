import { useMemo } from 'react';
import { Quote } from '@/data/types';
import quotesData from '@/data/quotes';

const allQuotes: Quote[] = quotesData as Quote[];

export function useQuotesByIds(ids: string[]): Quote[] {
  return useMemo(() => {
    return allQuotes.filter((q) => ids.includes(q.id));
  }, [ids]);
}

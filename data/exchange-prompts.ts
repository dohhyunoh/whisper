import { MoodId } from '@/data/moods';

// The seed shown after check-in: "why do you feel [mood]?" reworded per the
// real weather moods. The reply is the soul of the feature — keep prompts
// answerable and light/deep by mood, but never let them drift into a generic
// daily-question bot (see docs/letter-exchange-pillar.md §4).
export const EXCHANGE_PROMPTS: Record<MoodId, string> = {
  clear: "What's feeling bright today?",
  cloudy: "What's weighing on you?",
  stormy: "What's got you frustrated?",
  windy: "What's keeping you restless?",
};

export function exchangePrompt(mood: MoodId): string {
  return EXCHANGE_PROMPTS[mood];
}

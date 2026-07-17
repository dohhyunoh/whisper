import { MoodId } from '@/data/moods';

// The seed shown after check-in: "why do you feel [mood]?" reworded per the
// real weather moods. The reply is the soul of the feature — keep prompts
// answerable and light/deep by mood, but never let them drift into a generic
// daily-question bot (see docs/letter-exchange-pillar.md §4).
//
// Variants rotate by calendar day so a returning poster gets a fresh angle.
// Index 0 is the original wording — the fallback when the date is unknown
// (seed posts, pre-0013 rows), so old posts keep their original label.
export const EXCHANGE_PROMPTS: Record<MoodId, string[]> = {
  clear: [
    "What's feeling bright today?",
    'What small thing went right today?',
    "What's giving you hope right now?",
    'What moment from today would you keep?',
  ],
  cloudy: [
    "What's weighing on you?",
    "What's been sitting heavy lately?",
    'What do you wish someone understood?',
    'What are you carrying alone right now?',
  ],
  stormy: [
    "What's got you frustrated?",
    "What's making you want to scream?",
    'What feels unfair right now?',
    'What pushed you to the edge today?',
  ],
  windy: [
    "What's keeping you restless?",
    "What can't your mind let go of?",
    "What's pulling you in two directions?",
    'What are you bracing for?',
  ],
};

// `date` selects the day's variant: compose passes today; the received screen
// passes the post's creation day so the label matches what the poster was
// actually asked. No date → original wording.
export function exchangePrompt(mood: MoodId, date?: Date): string {
  const variants = EXCHANGE_PROMPTS[mood];
  if (!date || !isFinite(date.getTime())) return variants[0];
  const day = Math.floor(date.getTime() / 86_400_000);
  return variants[day % variants.length];
}

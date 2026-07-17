import { MoodId } from '@/data/moods';

// Openers for the respond screen — shown only while the input is empty, and
// they only *start* the note (tap → text lands in the input, user finishes the
// thought). Never full canned messages: the receiver should get something a
// stranger actually wrote for them. Hardcoded for now; an AI suggestion could
// replace the pool later without changing the UI contract.
const REPLY_STARTERS: Record<MoodId, string[]> = {
  clear: [
    'Reading this made me smile because ',
    'Hold onto this feeling,',
    'I love this for you. It reminds me ',
    'Days like yours give me hope that ',
  ],
  cloudy: [
    "I've felt this too, and what helped me was ",
    "You're not alone in this and ",
    'Reading your words, I want you to know ',
    "It makes sense that you're tired. ",
  ],
  stormy: [
    'Your anger makes sense to me because ',
    "I've been this angry too, and ",
    'You have every right to feel this. ',
    'What got me through something like this was ',
  ],
  windy: [
    "When my mind won't settle, what helps me is ",
    "You're not wrong for feeling pulled like this ",
    "Maybe you don't need the answer yet. ",
    "I know that restlessness, and ",
  ],
};

// Three starters for today, rotated daily so regular repliers see variety.
export function replyStarters(mood: MoodId): string[] {
  const pool = REPLY_STARTERS[mood] ?? REPLY_STARTERS.cloudy;
  const day = Math.floor(Date.now() / 86_400_000);
  const start = day % pool.length;
  return [0, 1, 2].map((i) => pool[(start + i) % pool.length]);
}

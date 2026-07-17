import { Quote } from '@/data/types';

// Single source of truth for translating onboarding-derived signals into the
// tag vocabulary used on quotes. user.interests is persisted in the legacy
// category:subcategory format for existing users, so the keys stay in that
// format and only the matching side moves to tags.
const INTEREST_TAGS: Record<string, string[]> = {
  // Specific religions intentionally exclude the generic theme:faith tag:
  // every faith quote carries it, so including it would boost other
  // religions' quotes too.
  'religion:christianity': ['theme:faith:christianity'],
  'religion:islam': ['theme:faith:islam'],
  'religion:hinduism': ['theme:faith:hinduism'],
  'religion:buddhism': ['theme:faith:buddhism'],
  'religion:general-spirituality': ['theme:faith'],
  'mood-boosters:calm': ['need:stillness', 'emotion:peace'],
  'mood-boosters:manifestation': ['need:motivation', 'emotion:hope'],
  'mood-boosters:philosophy': ['need:perspective'],
  'mood-boosters:daily-motivation': ['need:motivation'],
  'mood-boosters:gratitude': ['emotion:joy'],
  'mood-boosters:poetry': ['tone:poetic'],
  'self-love:mental-health': ['theme:healing', 'need:comfort'],
  'self-love:rest-recharge': ['need:stillness', 'emotion:exhaustion', 'situation:burnout'],
  'self-love:self-worth': ['theme:self-worth', 'need:validation'],
  'self-love:body-positivity': ['theme:body-image'],
  'relationships:letting-go': ['theme:letting-go', 'situation:post-breakup'],
  'relationships:partnership': ['theme:romantic-love'],
  'relationships:dating': ['situation:dating', 'theme:romantic-love'],
  'relationships:attracting-love': ['theme:romantic-love', 'emotion:longing'],
  'relationships:family': ['theme:family', 'situation:parenting'],
  'relationships:friendship': ['theme:friendship'],
  'empowerment:career': ['theme:career', 'theme:purpose'],
  'empowerment:overcoming-obstacles': ['need:challenge', 'theme:growth'],
  'empowerment:financial-independence': ['theme:money'],
  'empowerment:finding-voice': ['theme:identity', 'theme:boundaries'],
};

// Mood → emotion tags. Substring matching fails for most of these ("Anxious"
// vs emotion:anxiety), so the map is explicit. Covers both vocabularies:
// onboarding primaryEmotion options and daily check-in weather mood ids.
const EMOTION_TAGS: Record<string, string[]> = {
  anxious: ['emotion:anxiety', 'emotion:fear'],
  sad: ['emotion:grief', 'emotion:loneliness'],
  angry: ['emotion:anger'],
  numb: ['emotion:numbness'],
  exhausted: ['emotion:exhaustion'],
  hopeful: ['emotion:hope'],
  // Daily check-in weather moods
  clear: ['emotion:joy', 'emotion:peace', 'emotion:hope'],
  cloudy: ['emotion:numbness', 'emotion:loneliness', 'emotion:exhaustion'],
  stormy: ['emotion:anger', 'emotion:grief', 'emotion:anxiety', 'emotion:heartbreak'],
  windy: ['emotion:anxiety', 'emotion:longing', 'emotion:fear'],
};

// Onboarding faithDetail answer → religion interest key. Shared by onboarding
// derivation (curating) and the settings Faith picker so the two can't drift.
export const RELIGION_INTEREST_FOR_FAITH: Record<string, string> = {
  Christianity: 'religion:christianity',
  Islam: 'religion:islam',
  Hinduism: 'religion:hinduism',
  Buddhism: 'religion:buddhism',
  Judaism: 'religion:general-spirituality',
  'General Spirituality': 'religion:general-spirituality',
};

// Faith gate. Every faith quote carries theme:faith and religion-specific ones
// additionally carry theme:faith:<religion> (verified across data/quotes).
// - No religion signal → no faith quotes at all, wildcards included.
// - Specific religion → own religion and generic-spirituality quotes only;
//   never another religion's.
export function filterQuotesByFaith(quotes: Quote[], interests: string[] | undefined): Quote[] {
  const religionInterests = (interests ?? []).filter((i) => i.startsWith('religion:'));
  if (religionInterests.length === 0) {
    return quotes.filter((q) => !(q.tags ?? []).includes('theme:faith'));
  }
  const allowed = tagsForInterests(religionInterests);
  return quotes.filter((q) => {
    const specific = (q.tags ?? []).filter((t) => t.startsWith('theme:faith:'));
    if (specific.length === 0) return true;
    return specific.some((t) => allowed.has(t));
  });
}

export function tagsForInterests(interests: string[] | undefined): Set<string> {
  const tags = new Set<string>();
  for (const interest of interests ?? []) {
    for (const tag of INTEREST_TAGS[interest] ?? []) tags.add(tag);
  }
  return tags;
}

export function interestTagOverlap(quote: Quote, interestTags: Set<string>): number {
  let n = 0;
  for (const tag of quote.tags ?? []) {
    if (interestTags.has(tag)) n++;
  }
  return n;
}

export function moodMatchesQuote(mood: string, quote: Quote): boolean {
  const emotionTags = EMOTION_TAGS[mood.toLowerCase()];
  if (!emotionTags || !quote.tags) return false;
  return quote.tags.some((t) => emotionTags.includes(t));
}

import { Quote } from '@/data/types';

// Self-Love & Wellness
import selfLoveSelfWorth from './self-love-self-worth.json';
import selfLoveBodyPositivity from './self-love-body-positivity.json';
import selfLoveMentalHealth from './self-love-mental-health.json';
import selfLoveRestRecharge from './self-love-rest-recharge.json';

// Love & Relationships
import relationshipsDating from './relationships-dating.json';
import relationshipsPartnership from './relationships-partnership.json';
import relationshipsFriendship from './relationships-friendship.json';
import relationshipsBreakups from './relationships-breakups.json';
import relationshipsFamily from './relationships-family.json';
import relationshipsAttractingLove from './relationships-attracting-love.json';

// Empowerment & Career
import empowermentCareer from './empowerment-career.json';
import empowermentOvercomingObstacles from './empowerment-overcoming-obstacles.json';
import empowermentFinancialIndependence from './empowerment-financial-independence.json';
import empowermentFindingVoice from './empowerment-finding-voice.json';

// Faith & Spirituality
import religionGeneralSpirituality from './religion-general-spirituality.json';
import religionChristianity from './religion-christianity.json';
import religionIslam from './religion-islam.json';
import religionHinduism from './religion-hinduism.json';
import religionBuddhism from './religion-buddhism.json';

// Mood Boosters
import moodDailyMotivation from './mood-daily-motivation.json';
import moodCalm from './mood-calm.json';
import moodGratitude from './mood-gratitude.json';
import moodPhilosophy from './mood-philosophy.json';

const allQuotes: Quote[] = [
  // Self-Love & Wellness
  ...selfLoveSelfWorth,
  ...selfLoveBodyPositivity,
  ...selfLoveMentalHealth,
  ...selfLoveRestRecharge,
  // Love & Relationships
  ...relationshipsDating,
  ...relationshipsPartnership,
  ...relationshipsFriendship,
  ...relationshipsBreakups,
  ...relationshipsFamily,
  ...relationshipsAttractingLove,
  // Empowerment & Career
  ...empowermentCareer,
  ...empowermentOvercomingObstacles,
  ...empowermentFinancialIndependence,
  ...empowermentFindingVoice,
  // Faith & Spirituality
  ...religionGeneralSpirituality,
  ...religionChristianity,
  ...religionIslam,
  ...religionHinduism,
  ...religionBuddhism,
  // Mood Boosters
  ...moodDailyMotivation,
  ...moodCalm,
  ...moodGratitude,
  ...moodPhilosophy,
] as Quote[];

export default allQuotes;

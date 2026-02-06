import { Quote } from '@/data/types';
import motivation from './motivation.json';
import philosophy from './philosophy.json';
import healthMental from './health-mental.json';
import healthPhysical from './health-physical.json';
import relationshipsDating from './relationships-dating.json';
import relationshipsBreakingUp from './relationships-breaking-up.json';
import relationshipsSingle from './relationships-single.json';
import religionChristianity from './religion-christianity.json';
import religionIslam from './religion-islam.json';
import religionHinduism from './religion-hinduism.json';
import religionBuddhism from './religion-buddhism.json';
import religionOther from './religion-other.json';

const allQuotes: Quote[] = [
  ...motivation,
  ...philosophy,
  ...healthMental,
  ...healthPhysical,
  ...relationshipsDating,
  ...relationshipsBreakingUp,
  ...relationshipsSingle,
  ...religionChristianity,
  ...religionIslam,
  ...religionHinduism,
  ...religionBuddhism,
  ...religionOther,
] as Quote[];

export default allQuotes;

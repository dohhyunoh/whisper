import { getJSON } from './mmkv';
import { getWeights, SwipeRecord } from './tag-weights';

export interface SoulNode {
  tag: string;
  label: string;
  weight: number;
  namespace: string; // 'emotion', 'theme', 'need', 'tone', etc.
}

export interface SoulSignature {
  nodes: SoulNode[];
  totalSwipes: number;
  likeCount: number;
  skipCount: number;
}

const MAX_NODES = 6;

function prettyLabel(rest: string): string {
  return rest.replace(/-/g, ' ');
}

export function computeSignature(): SoulSignature {
  const weights = getWeights();
  const swipes = getJSON<SwipeRecord[]>('swipes.v1') ?? [];

  const entries = Object.entries(weights)
    .filter(([, w]) => w > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, MAX_NODES);

  const nodes: SoulNode[] = entries.map(([tag, weight]) => {
    const [namespace, ...rest] = tag.split(':');
    return {
      tag,
      label: prettyLabel(rest.join(':')),
      weight,
      namespace,
    };
  });

  const likeCount = swipes.filter((s) => s.dir === 'like').length;
  const skipCount = swipes.filter((s) => s.dir === 'skip').length;

  return {
    nodes,
    totalSwipes: swipes.length,
    likeCount,
    skipCount,
  };
}

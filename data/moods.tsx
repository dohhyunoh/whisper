import CloudIconSvg from '@/assets/svg/streak/CloudIconSvg';
import StormIconSvg from '@/assets/svg/streak/StormIconSvg';
import SunIconSvg from '@/assets/svg/streak/SunIconSvg';
import WindIconSvg from '@/assets/svg/streak/WindIconSvg';
import React from 'react';

export type MoodId = 'clear' | 'cloudy' | 'stormy' | 'windy';

export interface Mood {
  id: MoodId;
  label: string;
  color: string;
  message: string;
  rive: number;
  icon: (size: number, color: string) => React.ReactNode;
}

export const MOODS: Mood[] = [
  {
    id: 'clear',
    label: 'Clear',
    color: '#89CFF0',
    message: 'Light, open, easy. Your mind feels bright and the day looks kind.',
    rive: require('@/assets/rive/clear_argo.riv'),
    icon: (size, color) => <SunIconSvg size={size} color={color} />,
  },
  {
    id: 'cloudy',
    label: 'Cloudy',
    color: '#A0B4C8',
    message: "Tender and tearful. There's a quiet sadness sitting close to the surface today.",
    rive: require('@/assets/rive/cloudy_argo.riv'),
    icon: (size, color) => <CloudIconSvg size={size} color={color} />,
  },
  {
    id: 'stormy',
    label: 'Stormy',
    color: '#8DA399',
    message: "Charged up and frustrated. Anger is crackling through — something's pushed you too far.",
    rive: require('@/assets/rive/stormy_argo.riv'),
    icon: (size, color) => <StormIconSvg size={size} color={color} />,
  },
  {
    id: 'windy',
    label: 'Windy',
    color: '#BFA6C9',
    message: "Restless and racing. Your heart's quick and your mind won't quite settle.",
    rive: require('@/assets/rive/windy_argo.riv'),
    icon: (size, color) => <WindIconSvg size={size} color={color} />,
  },
];

export function findMoodByLabel(label: string | undefined): Mood | undefined {
  if (!label) return undefined;
  const lower = label.toLowerCase();
  return MOODS.find((m) => m.id === lower || m.label.toLowerCase() === lower);
}

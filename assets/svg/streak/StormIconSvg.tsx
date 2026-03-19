import React from 'react';
import Svg, { Path, Line } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

export default function StormIconSvg({ size = 24, color = '#8DA399' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Cloud */}
      <Path
        d="M6.5 16C4.015 16 2 13.985 2 11.5c0-2.2 1.575-4.035 3.665-4.435C6.28 4.505 8.895 2.5 12 2.5c3.865 0 7 3.135 7 7h.5c1.93 0 3.5 1.57 3.5 3.5S21.43 16.5 19.5 16.5H6.5"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Rain drops */}
      <Line x1="9" y1="18.5" x2="8" y2="21" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1="13" y1="18.5" x2="12" y2="21" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1="17" y1="18.5" x2="16" y2="21" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

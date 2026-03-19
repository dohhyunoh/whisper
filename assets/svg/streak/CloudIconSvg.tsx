import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

export default function CloudIconSvg({ size = 24, color = '#A0B4C8' }: Props) {
  // Simple cloud outline that scales with size
  const s = size / 24; // scale factor based on 24px base
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M6.5 18.5C4.015 18.5 2 16.485 2 14c0-2.2 1.575-4.035 3.665-4.435C6.28 7.005 8.895 5 12 5c3.865 0 7 3.135 7 7h.5c1.93 0 3.5 1.57 3.5 3.5S21.43 19 19.5 19h-13c-.17 0-.335-.005-.5-.015"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

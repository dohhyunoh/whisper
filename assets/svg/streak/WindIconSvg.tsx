import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

export default function WindIconSvg({ size = 24, color = '#BFA6C9' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Three flowing wind lines */}
      <Path
        d="M3 8h10a2.5 2.5 0 1 0-2.5-2.5"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 12h14a2.5 2.5 0 1 1-2.5 2.5"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 16h6a2 2 0 1 1-2 2"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

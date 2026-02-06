import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface StarProps {
  size?: number;
  color?: string;
}

export function StarCombo6({ size = 80, color = '#FFFFFF' }: StarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        d="M50 0 C52 35 65 48 100 50 C65 52 52 65 50 100 C48 65 35 52 0 50 C35 48 48 35 50 0Z"
        fill={color}
      />
      <Path
        d="M22 8 C23 18 27 22 37 23 C27 24 23 28 22 38 C21 28 17 24 7 23 C17 22 21 18 22 8Z"
        fill={color}
        opacity={0.6}
      />
    </Svg>
  );
}

export function StarCombo8({ size = 80, color = '#FFFFFF' }: StarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        d="M50 5 C52 38 62 48 95 50 C62 52 52 62 50 95 C48 62 38 52 5 50 C38 48 48 38 50 5Z"
        fill={color}
      />
      <Path
        d="M50 20 C51 42 58 49 80 50 C58 51 51 58 50 80 C49 58 42 51 20 50 C42 49 49 42 50 20Z"
        fill={color}
        opacity={0.4}
      />
    </Svg>
  );
}

export function StarStrokeSmoothray({ size = 40, color = '#FFFFFF' }: StarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        d="M50 0 C52 40 60 48 100 50 C60 52 52 60 50 100 C48 60 40 52 0 50 C40 48 48 40 50 0Z"
        fill={color}
      />
    </Svg>
  );
}

import React from 'react';
import Svg, { Circle, Line } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

export default function SunIconSvg({ size = 24, color = '#89CFF0' }: Props) {
  const c = size / 2;
  const r = size * 0.2;
  const rayInner = size * 0.35;
  const rayOuter = size * 0.46;
  const strokeW = size * 0.08;

  const rays = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45 * Math.PI) / 180;
    return {
      x1: c + rayInner * Math.cos(angle),
      y1: c + rayInner * Math.sin(angle),
      x2: c + rayOuter * Math.cos(angle),
      y2: c + rayOuter * Math.sin(angle),
    };
  });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={strokeW} />
      {rays.map((ray, i) => (
        <Line
          key={i}
          x1={ray.x1}
          y1={ray.y1}
          x2={ray.x2}
          y2={ray.y2}
          stroke={color}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
      ))}
    </Svg>
  );
}

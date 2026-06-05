import { SoulNode } from '@/utils/soul-signature';
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

const NAMESPACE_COLOR: Record<string, string> = {
  emotion: '#F4B6C2',
  theme: '#A7C7DC',
  need: '#F2D8A7',
  tone: '#C9B8E0',
};
const DEFAULT_COLOR = '#FFFFFF';
const LABEL_FONT_SIZE = 11;
const LABEL_LINE_HEIGHT = 13;
const MAX_LABEL_CHARS = 14;

export function colorForNode(node: SoulNode): string {
  return NAMESPACE_COLOR[node.namespace] ?? DEFAULT_COLOR;
}

export function prettyLabel(node: SoulNode): string {
  const leaf = node.tag.split(':').pop() ?? node.label;
  const pretty = leaf.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  if (pretty.length <= MAX_LABEL_CHARS) return pretty;
  return pretty.slice(0, MAX_LABEL_CHARS - 1) + '…';
}

interface ConstellationProps {
  nodes: SoulNode[];
  size: number;
}

export function ConstellationView({ nodes, size }: ConstellationProps) {
  const center = size / 2;
  const radius = size * 0.28;
  const count = nodes.length;
  const maxWeight = nodes[0]?.weight ?? 1;

  // Evenly spaced angles starting from top (-90°), going clockwise.
  // With 6 nodes, this avoids the 3 and 9 o'clock positions, so long
  // labels never need to fit horizontally on the edges.
  const positions = nodes.map((node, i) => {
    const angle = (-Math.PI / 2) + (i / count) * Math.PI * 2;
    const w = node.weight / maxWeight;
    return {
      ...node,
      angle,
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
      starSize: 5 + w * 8,
      glowSize: 12 + w * 14,
      color: colorForNode(node),
      label: prettyLabel(node),
    };
  });

  return (
    <View style={{ width: size, height: size, overflow: 'visible' }}>
      <Svg width={size} height={size} style={{ overflow: 'visible' }}>
        {/* Center: subtle ring + tiny dot */}
        <Circle
          cx={center}
          cy={center}
          r={size * 0.06}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={1}
          fill="none"
        />
        <Circle cx={center} cy={center} r={2.5} fill="rgba(255,255,255,0.7)" />

        {/* Connection lines */}
        {positions.map((p) => (
          <Line
            key={`l-${p.tag}`}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={0.6}
          />
        ))}

        {/* Stars: glow + solid */}
        {positions.map((p) => (
          <React.Fragment key={p.tag}>
            <Circle cx={p.x} cy={p.y} r={p.glowSize} fill={p.color} opacity={0.18} />
            <Circle cx={p.x} cy={p.y} r={p.starSize} fill={p.color} opacity={0.95} />
          </React.Fragment>
        ))}

        {/* Labels — all stacked vertically above or below the star, never to the side.
            This avoids horizontal overflow even for long single-word labels. */}
        {positions.map((p) => {
          const words = p.label.split(' ');
          const labelOffset = p.starSize + 18;
          const sinA = Math.sin(p.angle);
          const isUpper = sinA < 0;
          const baseX = p.x;
          const baseY = isUpper
            ? p.y - labelOffset - (words.length - 1) * LABEL_LINE_HEIGHT
            : p.y + labelOffset + LABEL_FONT_SIZE / 2;
          return (
            <React.Fragment key={`t-${p.tag}`}>
              {words.map((word, i) => (
                <SvgText
                  key={`${p.tag}-w${i}`}
                  x={baseX}
                  y={baseY + i * LABEL_LINE_HEIGHT}
                  fill="rgba(255,255,255,0.9)"
                  fontSize={LABEL_FONT_SIZE}
                  fontWeight="500"
                  textAnchor="middle"
                >
                  {word}
                </SvgText>
              ))}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

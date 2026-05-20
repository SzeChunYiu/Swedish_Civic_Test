import { Circle, Ellipse, G, Path, Svg } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

import { colors } from '../../lib/theme';
import type { MascotExpression } from './DalaMascot';

export interface LumiMascotProps extends Omit<SvgProps, 'height' | 'viewBox' | 'width'> {
  accessibilityLabel?: string;
  expression?: MascotExpression;
  size?: number;
}

const expressionLabels: Record<MascotExpression, string> = {
  idle: 'Lumi mascot idle',
  happy: 'Lumi mascot happy',
  oops: 'Lumi mascot oops',
  thinking: 'Lumi mascot thinking',
  celebrate: 'Lumi mascot celebrate',
};

export function LumiMascot({
  accessibilityLabel,
  expression = 'idle',
  size = 96,
  ...svgProps
}: LumiMascotProps) {
  const label = accessibilityLabel ?? expressionLabels[expression];

  return (
    <Svg
      accessibilityLabel={label}
      accessibilityRole="image"
      height={size}
      viewBox="0 0 128 128"
      width={size}
      {...svgProps}
    >
      <G id="shadow" fill={colors.text} opacity={0.12}>
        <Ellipse cx={64} cy={expression === 'celebrate' ? 114 : 112} rx={31} ry={7} />
      </G>
      <G
        id="body"
        stroke={colors.text}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={4}
      >
        <Path
          d="M43 31c0-7 6-13 13-13h16c7 0 13 6 13 13v56c0 9-7 16-16 16H59c-9 0-16-7-16-16V31Z"
          fill={colors.teal}
        />
        <Path d="M52 38h24v38c0 7-5 12-12 12s-12-5-12-12V38Z" fill={colors.badgeBlueBg} />
        <Path d="M54 18h20l5 13H49l5-13Z" fill={colors.surfaceWarm} />
        <Path d="M53 101l11 12 11-12H53Z" fill={colors.pink} />
      </G>
      <G
        id="decor"
        stroke={colors.text}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
      >
        <Path d="M52 51h24M52 64h24" fill="none" />
        <Circle cx={48} cy={86} fill={colors.surfaceWarm} r={4} />
        <Circle cx={80} cy={86} fill={colors.surfaceWarm} r={4} />
      </G>
      {renderFace(expression)}
      {expression === 'happy' ? renderHappyAccent() : null}
      {expression === 'oops' ? renderOopsAccent() : null}
      {expression === 'thinking' ? renderThinkingAccent() : null}
      {expression === 'celebrate' ? renderCelebrateAccent() : null}
    </Svg>
  );
}

function renderFace(expression: MascotExpression) {
  if (expression === 'oops') {
    return (
      <G id="face" stroke={colors.text} strokeLinecap="round" strokeWidth={4}>
        <Path d="M57 58h.1M71 58h.1" />
        <Path d="M58 72c4-3 8-3 12 0" fill="none" />
      </G>
    );
  }

  if (expression === 'thinking') {
    return (
      <G id="face" stroke={colors.text} strokeLinecap="round" strokeWidth={4}>
        <Path d="M56 58h.1M70 57h.1" />
        <Path d="M58 71c4 1 8 1 12-1" fill="none" />
      </G>
    );
  }

  if (expression === 'happy' || expression === 'celebrate') {
    return (
      <G id="face" stroke={colors.text} strokeLinecap="round" strokeWidth={4}>
        <Path d="M56 57c3 3 6 3 8 0M66 57c3 3 6 3 8 0M57 69c5 7 10 7 15 0" fill="none" />
      </G>
    );
  }

  return (
    <G id="face" stroke={colors.text} strokeLinecap="round" strokeWidth={4}>
      <Path d="M57 58h.1M71 58h.1" />
      <Path d="M58 70c4 3 8 3 12 0" fill="none" />
    </G>
  );
}

function renderHappyAccent() {
  return (
    <G id="expression" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M30 42l4 7 8-11" fill="none" stroke={colors.success} strokeWidth={4} />
      <Circle
        cx={91}
        cy={45}
        fill={colors.badgeBlueBg}
        r={4}
        stroke={colors.text}
        strokeWidth={3}
      />
    </G>
  );
}

function renderOopsAccent() {
  return (
    <G id="expression" fill="none" stroke={colors.warning} strokeLinecap="round" strokeWidth={4}>
      <Path d="M34 45c5-5 12-5 17 0M42 39v13" />
    </G>
  );
}

function renderThinkingAccent() {
  return (
    <G
      id="expression"
      fill="none"
      stroke={colors.teal}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={4}
    >
      <Path d="M30 49c0-6 5-10 11-10s10 4 10 9c0 6-7 7-7 13" />
      <Path d="M44 72h.1" />
    </G>
  );
}

function renderCelebrateAccent() {
  return (
    <G id="expression" strokeLinecap="round" strokeLinejoin="round">
      <Path
        d="M27 39l6 3-5 5 2 7-7-3-6 4 2-7-6-4 8-1 3-7 3 3Z"
        fill={colors.badgeBlueBg}
        stroke={colors.text}
        strokeWidth={3}
      />
      <Circle cx={93} cy={42} fill={colors.pink} r={4} />
      <Path
        d="M94 78v9M89 83h10M36 81l5 5M41 81l-5 5"
        fill="none"
        stroke={colors.success}
        strokeWidth={4}
      />
    </G>
  );
}

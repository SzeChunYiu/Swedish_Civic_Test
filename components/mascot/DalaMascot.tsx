import { Circle, Ellipse, G, Path, Svg } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

import { colors, flagColors } from '../../lib/theme';

export type MascotExpression = 'idle' | 'happy' | 'oops' | 'thinking' | 'celebrate';

export interface DalaMascotProps extends Omit<SvgProps, 'height' | 'viewBox' | 'width'> {
  accessibilityLabel?: string;
  expression?: MascotExpression;
  size?: number;
}

const expressionLabels: Record<MascotExpression, string> = {
  idle: 'Dala mascot idle',
  happy: 'Dala mascot happy',
  oops: 'Dala mascot oops',
  thinking: 'Dala mascot thinking',
  celebrate: 'Dala mascot celebrate',
};

export function DalaMascot({
  accessibilityLabel,
  expression = 'idle',
  size = 96,
  ...svgProps
}: DalaMascotProps) {
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
        <Ellipse cx={58} cy={expression === 'celebrate' ? 114 : 112} rx={40} ry={8} />
      </G>
      <G
        id="body"
        stroke={colors.text}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={4}
      >
        <Path
          d="M29 91V59c0-9 7-16 16-16h19c8 0 15 4 20 10l6 8 5-20c2-8 8-14 16-16l6-1-2 18c-1 10-5 19-12 27l-6 7v15h7c3 0 5 2 5 5v9H82V87H48v18H28V96c0-3 2-5 5-5h-4Z"
          fill={flagColors.blue}
        />
        <Path d="M40 43c4-8 12-14 22-16l7 17H45l-5-1Z" fill={colors.navy} />
        <Path d="M95 44c4-7 10-12 18-14l-2 12c-1 5-3 10-7 14l-9-12Z" fill={colors.surfaceWarm} />
      </G>
      <G
        id="decor"
        stroke={colors.text}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
      >
        <Path d="M55 58h28l4 22H50l5-22Z" fill={colors.badgeBlueBg} />
        <Path d="M60 64h18l2 10H57l3-10Z" fill={flagColors.gold} />
        <Path d="M45 51c-3 5-4 10-2 15M39 58h8M66 58v22M75 58v22" fill="none" />
        <Circle
          cx={37}
          cy={74}
          fill={
            expression === 'oops'
              ? colors.warning
              : expression === 'thinking'
                ? colors.teal
                : flagColors.gold
          }
          r={3}
        />
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
      <G
        id="face"
        stroke={colors.text}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={4}
      >
        <Path d="M95 51c3-1 7-1 10 1" fill="none" />
        <Path d="M99 62c3 0 5 2 5 5s-2 5-5 5-5-2-5-5 2-5 5-5Z" fill={colors.badgeBlueBg} />
        <Circle cx={99} cy={47} fill={colors.text} r={2.5} stroke="none" />
        <Circle cx={108} cy={57} fill={colors.warning} opacity={0.35} r={2.5} stroke="none" />
      </G>
    );
  }

  if (expression === 'thinking') {
    return (
      <G
        id="face"
        stroke={colors.text}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={4}
      >
        <Path d="M94 51c4-2 8-1 11 2" fill="none" />
        <Path d="M95 66c4-2 8-2 12 0" fill="none" />
        <Circle cx={98} cy={47} fill={colors.text} r={2.5} stroke="none" />
      </G>
    );
  }

  return (
    <G id="face" stroke={colors.text} strokeLinecap="round" strokeLinejoin="round" strokeWidth={4}>
      <Path d={expression === 'idle' ? 'M96 52c3 2 6 2 9 0' : 'M95 51c3 4 8 4 11 0'} fill="none" />
      <Path
        d={expression === 'idle' ? 'M94 63c4 3 8 3 12 0' : 'M93 62c5 7 13 7 17 0'}
        fill="none"
      />
      <Circle cx={99} cy={47} fill={colors.text} r={2.5} stroke="none" />
    </G>
  );
}

function renderHappyAccent() {
  return (
    <G id="expression" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={108} cy={58} fill={flagColors.gold} opacity={0.55} r={3} />
      <Path d="M20 51l4 7 8-13 5 8 7-12 4 7" fill="none" stroke={colors.success} strokeWidth={3} />
    </G>
  );
}

function renderOopsAccent() {
  return (
    <G id="expression" fill="none" stroke={colors.warning} strokeLinecap="round" strokeWidth={3}>
      <Path d="M21 49c5-4 11-4 16 0M27 43v12" />
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
      <Path d="M24 47c0-6 5-10 11-10 7 0 11 4 11 9 0 7-8 8-8 14" />
      <Path d="M38 71h.1" />
    </G>
  );
}

function renderCelebrateAccent() {
  return (
    <G id="expression" strokeLinecap="round" strokeLinejoin="round">
      <Path
        d="M20 40l7 3-6 4 3 7-7-3-6 4 2-8-6-4 8-1 3-7 2 5Z"
        fill={flagColors.gold}
        stroke={colors.text}
        strokeWidth={3}
      />
      <Path
        d="M44 25v9M39 30h10M112 79v9M107 84h10"
        fill="none"
        stroke={colors.teal}
        strokeWidth={4}
      />
      <Circle cx={27} cy={72} fill={colors.pink} r={3} />
      <Circle cx={116} cy={61} fill={flagColors.gold} r={3} />
      <Path d="M79 25l5 5M84 25l-5 5" stroke={colors.success} strokeWidth={4} />
    </G>
  );
}

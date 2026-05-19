import { Circle, Path, Svg } from 'react-native-svg';

import { colors, space } from '../../../lib/theme';

export interface TabBarIconProps {
  color?: string;
  size?: number;
}

const defaultTabIconSize = space[3];

function iconColor(color?: string) {
  return color ?? colors.textMuted;
}

export function HomeTabIcon({ color, size = defaultTabIconSize }: TabBarIconProps) {
  const stroke = iconColor(color);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-9.5z"
        stroke={stroke}
        strokeLinejoin="round"
        strokeWidth={1.75}
      />
    </Svg>
  );
}

export function LearnTabIcon({ color, size = defaultTabIconSize }: TabBarIconProps) {
  const stroke = iconColor(color);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 5.25h5.25A2.25 2.25 0 0 1 12 7.5v12a2.25 2.25 0 0 0-2.25-2.25H4.5v-12z"
        stroke={stroke}
        strokeLinejoin="round"
        strokeWidth={1.75}
      />
      <Path
        d="M19.5 5.25h-5.25A2.25 2.25 0 0 0 12 7.5v12a2.25 2.25 0 0 1 2.25-2.25h5.25v-12z"
        stroke={stroke}
        strokeLinejoin="round"
        strokeWidth={1.75}
      />
    </Svg>
  );
}

export function PracticeTabIcon({ color, size = defaultTabIconSize }: TabBarIconProps) {
  const stroke = iconColor(color);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 5h10" stroke={stroke} strokeLinecap="round" strokeWidth={1.75} />
      <Path d="M7 12h7" stroke={stroke} strokeLinecap="round" strokeWidth={1.75} />
      <Path d="M7 19h4" stroke={stroke} strokeLinecap="round" strokeWidth={1.75} />
      <Path
        d="M17 14.5 19 16.5 22 12.5"
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
      />
    </Svg>
  );
}

export function ExamTabIcon({ color, size = defaultTabIconSize }: TabBarIconProps) {
  const stroke = iconColor(color);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 4h8l2 2v14H6V6l2-2z" stroke={stroke} strokeLinejoin="round" strokeWidth={1.75} />
      <Path d="M9 10h6" stroke={stroke} strokeLinecap="round" strokeWidth={1.75} />
      <Path d="M9 14h4" stroke={stroke} strokeLinecap="round" strokeWidth={1.75} />
    </Svg>
  );
}

export function MistakesTabIcon({ color, size = defaultTabIconSize }: TabBarIconProps) {
  const stroke = iconColor(color);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={8} stroke={stroke} strokeWidth={1.75} />
      <Path d="M12 7.5v5.25" stroke={stroke} strokeLinecap="round" strokeWidth={1.75} />
      <Circle cx={12} cy={16.5} r={0.75} fill={stroke} />
    </Svg>
  );
}

export function ProfileTabIcon({ color, size = defaultTabIconSize }: TabBarIconProps) {
  const stroke = iconColor(color);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={3.5} stroke={stroke} strokeWidth={1.75} />
      <Path
        d="M5.5 20a6.5 6.5 0 0 1 13 0"
        stroke={stroke}
        strokeLinecap="round"
        strokeWidth={1.75}
      />
    </Svg>
  );
}

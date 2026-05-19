import { Circle, Path, Rect, Svg } from 'react-native-svg';

import { colors } from '../../../lib/theme';

export type TabBarIconName = 'home' | 'learn' | 'practice' | 'exam' | 'mistakes' | 'profile';

type TabBarIconProps = {
  color?: string;
  focused?: boolean;
  name: TabBarIconName;
  size?: number;
};

function renderIconPath(name: TabBarIconName, stroke: string, strokeWidth: number) {
  switch (name) {
    case 'home':
      return (
        <>
          <Path
            d="M3.75 10.75 12 4l8.25 6.75"
            stroke={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
          <Path
            d="M6.5 10.5V20h11v-9.5"
            stroke={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
          <Path
            d="M9.75 20v-5.25h4.5V20"
            stroke={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
        </>
      );
    case 'learn':
      return (
        <>
          <Path
            d="M4.75 5.5h5.5A3.25 3.25 0 0 1 13.5 8.75V20a3.25 3.25 0 0 0-3.25-3.25h-5.5V5.5z"
            stroke={stroke}
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
          <Path
            d="M19.25 5.5h-5.5A3.25 3.25 0 0 0 10.5 8.75V20a3.25 3.25 0 0 1 3.25-3.25h5.5V5.5z"
            stroke={stroke}
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
        </>
      );
    case 'practice':
      return (
        <>
          <Circle cx={12} cy={12} r={8.25} stroke={stroke} strokeWidth={strokeWidth} />
          <Path
            d="m8.75 12.25 2.25 2.25 4.75-5"
            stroke={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
        </>
      );
    case 'exam':
      return (
        <>
          <Rect
            height={14}
            rx={2}
            stroke={stroke}
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
            width={11}
            x={6.5}
            y={6.25}
          />
          <Path
            d="M9.25 6.25V4h5.5v2.25"
            stroke={stroke}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
          />
          <Path d="M9.5 11h5" stroke={stroke} strokeLinecap="round" strokeWidth={strokeWidth} />
          <Path d="M9.5 15h3.75" stroke={stroke} strokeLinecap="round" strokeWidth={strokeWidth} />
        </>
      );
    case 'mistakes':
      return (
        <>
          <Path
            d="M12 4.25 21 19.5H3L12 4.25z"
            stroke={stroke}
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
          <Path d="M12 9.5v4" stroke={stroke} strokeLinecap="round" strokeWidth={strokeWidth} />
          <Circle cx={12} cy={16.75} fill={stroke} r={1} />
        </>
      );
    case 'profile':
      return (
        <>
          <Circle cx={12} cy={8.25} r={3.25} stroke={stroke} strokeWidth={strokeWidth} />
          <Path
            d="M5.75 19.75a6.25 6.25 0 0 1 12.5 0"
            stroke={stroke}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
          />
        </>
      );
  }
}

export function TabBarIcon({ focused = false, name, size = 24 }: TabBarIconProps) {
  const stroke = focused ? colors.accent : colors.textSecondary;
  const strokeWidth = focused ? 2.2 : 1.8;

  return (
    <Svg
      accessibilityElementsHidden
      focusable={false}
      height={size}
      importantForAccessibility="no-hide-descendants"
      testID={`tab-icon-${name}`}
      viewBox="0 0 24 24"
      width={size}
    >
      {renderIconPath(name, stroke, strokeWidth)}
    </Svg>
  );
}

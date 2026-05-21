import { Path, Svg } from 'react-native-svg';

export function CloseIcon({ size = 16, color }: { size?: number; color: string }) {
  const stroke = color;
  return (
    <Svg
      accessibilityElementsHidden
      fill="none"
      focusable={false}
      height={size}
      importantForAccessibility="no-hide-descendants"
      testID="language-picker-close-icon"
      viewBox="0 0 24 24"
      width={size}
    >
      <Path d="M6.5 6.5l11 11" stroke={stroke} strokeLinecap="round" strokeWidth={2} />
      <Path d="M17.5 6.5l-11 11" stroke={stroke} strokeLinecap="round" strokeWidth={2} />
    </Svg>
  );
}

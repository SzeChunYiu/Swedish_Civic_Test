import { Circle, Path, Svg } from 'react-native-svg';

export function SearchIcon({ size = 22, color }: { size?: number; color: string }) {
  const stroke = color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={7} stroke={stroke} strokeWidth={1.75} />
      <Path d="M20 20l-3.5-3.5" stroke={stroke} strokeWidth={1.75} strokeLinecap="round" />
    </Svg>
  );
}

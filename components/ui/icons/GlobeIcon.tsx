import { Circle, Path, Svg } from 'react-native-svg';

export function GlobeIcon({ size = 22, color }: { size?: number; color: string }) {
  const stroke = color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={stroke} strokeWidth={1.75} />
      <Path d="M3 12h18" stroke={stroke} strokeWidth={1.75} />
      <Path
        d="M12 3a13.5 13.5 0 0 1 0 18M12 3a13.5 13.5 0 0 0 0 18"
        stroke={stroke}
        strokeWidth={1.75}
      />
    </Svg>
  );
}

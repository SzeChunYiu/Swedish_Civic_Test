import { Path, Svg } from 'react-native-svg';

export function BookmarkIcon({ size = 22, color }: { size?: number; color: string }) {
  const stroke = color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 3.75A.75.75 0 0 1 6.75 3h10.5a.75.75 0 0 1 .75.75V21l-6-3.5L6 21V3.75z"
        stroke={stroke}
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

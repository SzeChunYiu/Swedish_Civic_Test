import { Path, Svg } from 'react-native-svg';

export function AudioIcon({
  size = 22,
  color,
  muted = false,
}: {
  size?: number;
  color: string;
  muted?: boolean;
}) {
  const stroke = color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 9v6h4l5 4V5L8 9H4z" stroke={stroke} strokeWidth={1.75} strokeLinejoin="round" />
      {muted ? (
        <Path d="M16 9l5 6m0-6l-5 6" stroke={stroke} strokeWidth={1.75} strokeLinecap="round" />
      ) : (
        <>
          <Path
            d="M17 8.5a5 5 0 0 1 0 7"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
          <Path d="M20 6a8 8 0 0 1 0 12" stroke={stroke} strokeWidth={1.75} strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion(): boolean {
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const handleReducedMotionChange = (enabled: boolean) => {
      if (isMounted) setReducedMotionEnabled(Boolean(enabled));
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then(handleReducedMotionChange)
      .catch(() => undefined);

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      handleReducedMotionChange,
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return reducedMotionEnabled;
}

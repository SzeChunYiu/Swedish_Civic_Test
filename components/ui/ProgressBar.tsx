import type { AppLanguage } from '../../lib/storage/settingsStore';
import {
  ProgressBar as RootProgressBar,
  type ProgressBarProps as RootProgressBarProps,
} from '../ProgressBar';

export interface ProgressBarProps extends Omit<RootProgressBarProps, 'languageOverride'> {
  language?: AppLanguage;
}

export function ProgressBar({ language = 'sv', ...progressBarProps }: ProgressBarProps) {
  return <RootProgressBar {...progressBarProps} languageOverride={language} />;
}

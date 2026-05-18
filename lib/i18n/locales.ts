import type { AppLanguage } from '../storage/settingsStore';

export type LocaleOption = {
  /** BCP-47-ish code, used as picker key. */
  code: string;
  /** English label, e.g. "Swedish". */
  label: string;
  /** Native rendering, e.g. "Svenska", "العربية". */
  nativeLabel: string;
  /** ISO 639-1 / -2 reference for fonts and screen-reader hints. */
  iso: string;
  /** True when full UI translations are bundled and tested. */
  available: boolean;
  /** True for right-to-left scripts (Arabic, Persian). Used for layout flips. */
  rtl: boolean;
  /** Falls back to this AppLanguage when 'available' is false. */
  fallback: AppLanguage;
};

/**
 * Locales we want to support — covers the largest immigrant communities in
 * Sweden plus the two reference languages (Swedish, English). Currently only
 * sv + en have full translations; the others are shown in the picker as
 * "Coming soon" so users know they're on the roadmap.
 */
export const locales: LocaleOption[] = [
  { code: 'sv', label: 'Swedish', nativeLabel: 'Svenska', iso: 'sv', available: true, rtl: false, fallback: 'sv' },
  { code: 'en', label: 'English', nativeLabel: 'English', iso: 'en', available: true, rtl: false, fallback: 'en' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', iso: 'ar', available: false, rtl: true, fallback: 'en' },
  { code: 'fa', label: 'Persian', nativeLabel: 'فارسی', iso: 'fa', available: false, rtl: true, fallback: 'en' },
  { code: 'so', label: 'Somali', nativeLabel: 'Soomaali', iso: 'so', available: false, rtl: false, fallback: 'en' },
  { code: 'ti', label: 'Tigrinya', nativeLabel: 'ትግርኛ', iso: 'ti', available: false, rtl: false, fallback: 'en' },
  { code: 'pl', label: 'Polish', nativeLabel: 'Polski', iso: 'pl', available: false, rtl: false, fallback: 'en' },
  { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe', iso: 'tr', available: false, rtl: false, fallback: 'en' },
  { code: 'zh-Hans', label: 'Chinese (Simplified)', nativeLabel: '简体中文', iso: 'zh', available: false, rtl: false, fallback: 'en' },
  { code: 'zh-Hant', label: 'Chinese (Traditional)', nativeLabel: '繁體中文', iso: 'zh', available: false, rtl: false, fallback: 'en' },
];

export function getLocale(code: string): LocaleOption {
  return locales.find((l) => l.code === code) ?? locales[1];
}

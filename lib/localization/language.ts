export const supportedLanguages = ['sv', 'en'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

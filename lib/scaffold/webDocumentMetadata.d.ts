export type WebDocumentLanguage = 'sv' | 'en';

export type WebDocumentMetaDescription = {
  readonly language: WebDocumentLanguage;
  readonly description: string;
};

export type WebDocumentMetadata = {
  readonly language: WebDocumentLanguage;
  readonly title: string;
  readonly applicationName: string;
  readonly appleMobileWebAppTitle: string;
  readonly description: string;
  readonly openGraphSiteName: string;
  readonly openGraphTitle: string;
  readonly openGraphDescription: string;
};

export const webDocumentMetaDescriptions: readonly WebDocumentMetaDescription[];
export const webDocumentMetadata: WebDocumentMetadata;
export function webDocumentDescriptionForLanguage(language: WebDocumentLanguage): string;

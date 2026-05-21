import type { AppLanguage } from '../../lib/storage/settingsStore';
import { LegalExternalLink, LegalLinkList } from './LegalPage';

type OfficialSourceNote = {
  publisher: string;
  retrievedDate: string;
  titleEn: string;
  titleSv: string;
  url: string;
};

type SourceLinkCopy = {
  openAuthorityBoundarySourceAccessibilityLabel: string;
  openEducationMaterialAccessibilityLabel: string;
  publisherLabel: string;
  retrievedLabel: string;
  urlLabel: string;
};

export const UHR_EDUCATION_MATERIAL_SOURCE = {
  publisher: 'Universitets- och högskolerådet (UHR)',
  retrievedDate: '2026-05-20',
  titleEn: 'UHR: Study material about Swedish society',
  titleSv: 'UHR: Utbildningsmaterial om det svenska samhället',
  url: 'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
} as const satisfies OfficialSourceNote;

export const UHR_AUTHORITY_BOUNDARY_SOURCE = {
  publisher: 'Universitets- och högskolerådet (UHR)',
  retrievedDate: '2026-05-20',
  titleEn: 'UHR: About the citizenship test',
  titleSv: 'UHR: Om medborgarskapsprovet',
  url: 'https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/',
} as const satisfies OfficialSourceNote;

const sourceLinkCopy: Record<AppLanguage, SourceLinkCopy> = {
  sv: {
    openAuthorityBoundarySourceAccessibilityLabel: 'Öppna UHR:s sida Om medborgarskapsprovet',
    openEducationMaterialAccessibilityLabel: 'Öppna UHR:s utbildningsmaterial',
    publisherLabel: 'Utgivare',
    retrievedLabel: 'Hämtad',
    urlLabel: 'URL',
  },
  en: {
    openAuthorityBoundarySourceAccessibilityLabel: 'Open UHR About the citizenship test page',
    openEducationMaterialAccessibilityLabel: 'Open UHR education material',
    publisherLabel: 'Publisher',
    retrievedLabel: 'Retrieved',
    urlLabel: 'URL',
  },
};

export function sourceTitleForLanguage(source: OfficialSourceNote, language: AppLanguage) {
  return language === 'en' ? source.titleEn : source.titleSv;
}

export function sourceDestinationForLanguage(source: OfficialSourceNote, language: AppLanguage) {
  const copy = sourceLinkCopy[language];
  return `${copy.publisherLabel}: ${source.publisher}\n${copy.retrievedLabel}: ${source.retrievedDate}\n${copy.urlLabel}: ${source.url}`;
}

type OfficialSourceLinkProps = {
  accessibilityLabel: string;
  href?: string;
  language: AppLanguage;
  source: OfficialSourceNote;
};

function OfficialSourceLink({
  accessibilityLabel,
  href,
  language,
  source,
}: OfficialSourceLinkProps) {
  return (
    <LegalExternalLink
      accessibilityLabel={accessibilityLabel}
      destination={sourceDestinationForLanguage(source, language)}
      href={href ?? source.url}
      label={sourceTitleForLanguage(source, language)}
    />
  );
}

export function UhrEducationMaterialLink({
  href,
  language,
}: {
  href?: string;
  language: AppLanguage;
}) {
  return (
    <OfficialSourceLink
      accessibilityLabel={sourceLinkCopy[language].openEducationMaterialAccessibilityLabel}
      href={href}
      language={language}
      source={UHR_EDUCATION_MATERIAL_SOURCE}
    />
  );
}

export function UhrAuthorityBoundaryLink({ language }: { language: AppLanguage }) {
  return (
    <OfficialSourceLink
      accessibilityLabel={sourceLinkCopy[language].openAuthorityBoundarySourceAccessibilityLabel}
      language={language}
      source={UHR_AUTHORITY_BOUNDARY_SOURCE}
    />
  );
}

export function SourceMaterialLinkList({ language }: { language: AppLanguage }) {
  return (
    <LegalLinkList>
      <UhrEducationMaterialLink language={language} />
      <UhrAuthorityBoundaryLink language={language} />
    </LegalLinkList>
  );
}

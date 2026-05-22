export type SourceAffordanceLanguage = 'sv' | 'en';

export interface SearchSourceAffordanceCase {
  chapterLinkName: RegExp;
  chapterQuery: string;
  inputName: string;
  language: SourceAffordanceLanguage;
  provenanceBadgeName: RegExp;
  provenanceLabel: string;
  provenanceQuery: string;
  sourceNoteName: RegExp;
}

export interface CitizenshipSourceAffordanceCase {
  checkedCheckboxName: RegExp;
  checkboxName: RegExp;
  disclaimerBodyName: RegExp;
  disclaimerLabel: RegExp;
  disclaimerTitle: string;
  language: SourceAffordanceLanguage;
  practiceLinkName: string;
  sourceLinkName: RegExp;
  sourcePublisher: string;
  sourceTitle: string;
  sourceUrlName: RegExp;
}

export const searchSourceAffordanceCases = [
  {
    language: 'sv',
    chapterQuery: 'kommun',
    chapterLinkName: /Öppna kapitlet/,
    inputName: 'Sök samhällsbegrepp och övningsfrågor',
    provenanceBadgeName: /Källtyp: UHR-källa/,
    provenanceLabel: 'UHR-källa',
    provenanceQuery: 'folkomröstning',
    sourceNoteName: /^Källanteckning:/,
  },
  {
    language: 'en',
    chapterQuery: 'municipality',
    chapterLinkName: /Open the chapter/,
    inputName: 'Search civic terms and practice questions',
    provenanceBadgeName: /Provenance: UHR source/,
    provenanceLabel: 'UHR source',
    provenanceQuery: 'municipality',
    sourceNoteName: /^Source note:/,
  },
] as const satisfies readonly SearchSourceAffordanceCase[];

export const citizenshipSourceAffordanceCases = [
  {
    checkedCheckboxName: /Markerad:/,
    checkboxName: /Ej markerad:/,
    disclaimerBodyName: /^Oberoende studieverktyg\./,
    disclaimerLabel: /Studieinformation: Oberoende studieverktyg/,
    disclaimerTitle: 'Studieinformation',
    language: 'sv',
    practiceLinkName: 'Öppna övningsläget för samhällskunskap',
    sourceLinkName: /Migrationsverket: Ansök om svenskt medborgarskap/,
    sourcePublisher: 'Migrationsverket',
    sourceTitle: 'Ansök om svenskt medborgarskap',
    sourceUrlName: /https:\/\/www\.migrationsverket\.se\//,
  },
  {
    checkedCheckboxName: /Marked:/,
    checkboxName: /Not marked:/,
    disclaimerBodyName: /^Independent study tool\./,
    disclaimerLabel: /Study disclaimer: Independent study tool/,
    disclaimerTitle: 'Study disclaimer',
    language: 'en',
    practiceLinkName: 'Open civic knowledge practice mode',
    sourceLinkName: /Migrationsverket: Apply for Swedish citizenship/,
    sourcePublisher: 'Migrationsverket',
    sourceTitle: 'Apply for Swedish citizenship',
    sourceUrlName: /https:\/\/www\.migrationsverket\.se\//,
  },
] as const satisfies readonly CitizenshipSourceAffordanceCase[];

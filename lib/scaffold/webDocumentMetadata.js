const WEB_DOCUMENT_TITLE = 'Almost Swedish';
const WEB_DOCUMENT_LANGUAGE = 'sv';
const WEB_DOCUMENT_DESCRIPTION_SV =
  'Öva svensk samhällskunskap med övningar utan uppkoppling, lokalt sparade framsteg och tydliga källhänvisningar.';
const WEB_DOCUMENT_DESCRIPTION_EN =
  'Practice Swedish civic knowledge with offline quizzes, local progress, and source references.';

const webDocumentMetaDescriptions = Object.freeze([
  Object.freeze({
    language: 'sv',
    description: WEB_DOCUMENT_DESCRIPTION_SV,
  }),
  Object.freeze({
    language: 'en',
    description: WEB_DOCUMENT_DESCRIPTION_EN,
  }),
]);

function webDocumentDescriptionForLanguage(language) {
  const entry = webDocumentMetaDescriptions.find((candidate) => candidate.language === language);
  if (!entry) {
    throw new Error(`Unsupported web document language: ${language}`);
  }
  return entry.description;
}

const webDocumentMetadata = Object.freeze({
  language: WEB_DOCUMENT_LANGUAGE,
  title: WEB_DOCUMENT_TITLE,
  applicationName: WEB_DOCUMENT_TITLE,
  appleMobileWebAppTitle: WEB_DOCUMENT_TITLE,
  description: webDocumentDescriptionForLanguage(WEB_DOCUMENT_LANGUAGE),
  openGraphSiteName: WEB_DOCUMENT_TITLE,
  openGraphTitle: WEB_DOCUMENT_TITLE,
  openGraphDescription: webDocumentDescriptionForLanguage(WEB_DOCUMENT_LANGUAGE),
});

module.exports = {
  webDocumentDescriptionForLanguage,
  webDocumentMetaDescriptions,
  webDocumentMetadata,
};

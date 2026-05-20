import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

import { colors } from '../lib/theme';

const webDocumentTitle = 'Almost Swedish';
const webDocumentDescription =
  'Practice Swedish civic knowledge with offline quizzes, local progress, and source references.';

export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html data-app-shell="expo-router" lang="sv">
      <head>
        <title>{webDocumentTitle}</title>
        <meta charSet="utf-8" />
        <meta content="IE=edge" httpEquiv="X-UA-Compatible" />
        <meta content="width=device-width, initial-scale=1, viewport-fit=cover" name="viewport" />
        <meta content={colors.canvas} name="theme-color" />
        <meta content={webDocumentTitle} name="application-name" />
        <meta content={webDocumentTitle} name="apple-mobile-web-app-title" />
        <meta content={webDocumentDescription} name="description" />
        <meta content={webDocumentTitle} property="og:site_name" />
        <meta content={webDocumentTitle} property="og:title" />
        <meta content={webDocumentDescription} property="og:description" />
        <ScrollViewStyleReset />
      </head>
      <body style={{ backgroundColor: colors.canvas }}>{children}</body>
    </html>
  );
}

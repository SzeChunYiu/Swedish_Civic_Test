import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

import { webDocumentMetadata } from '../lib/scaffold/webDocumentMetadata';
import { colors } from '../lib/theme';

export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html data-app-shell="expo-router" lang={webDocumentMetadata.language}>
      <head>
        <title>{webDocumentMetadata.title}</title>
        <meta charSet="utf-8" />
        <meta content="IE=edge" httpEquiv="X-UA-Compatible" />
        <meta content="width=device-width, initial-scale=1, viewport-fit=cover" name="viewport" />
        <meta content={colors.canvas} name="theme-color" />
        <meta content={webDocumentMetadata.applicationName} name="application-name" />
        <meta
          content={webDocumentMetadata.appleMobileWebAppTitle}
          name="apple-mobile-web-app-title"
        />
        <meta content={webDocumentMetadata.description} name="description" />
        <meta content={webDocumentMetadata.openGraphSiteName} property="og:site_name" />
        <meta content={webDocumentMetadata.openGraphTitle} property="og:title" />
        <link href="manifest.webmanifest" rel="manifest" />
        <meta content={webDocumentMetadata.openGraphDescription} property="og:description" />
        <ScrollViewStyleReset />
      </head>
      <body style={{ backgroundColor: colors.canvas }}>{children}</body>
    </html>
  );
}

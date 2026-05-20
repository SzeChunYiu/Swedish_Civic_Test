import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

import {
  expoRouterShellContract,
  expoRouterWebDocumentMetaDescriptions,
} from '../lib/scaffold/routerShellManifest';
import { colors } from '../lib/theme';

const webDocumentLanguage = expoRouterShellContract.webLanguage;
const webDocumentMetaDescription = expoRouterWebDocumentMetaDescriptions.find(
  ({ language }) => language === webDocumentLanguage,
)?.description;

if (webDocumentMetaDescription === undefined) {
  throw new Error(`Missing web document meta description for ${webDocumentLanguage}`);
}

export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html data-app-shell="expo-router" lang={webDocumentLanguage}>
      <head>
        <meta charSet="utf-8" />
        <meta content="IE=edge" httpEquiv="X-UA-Compatible" />
        <meta content="width=device-width, initial-scale=1, viewport-fit=cover" name="viewport" />
        <meta content={colors.canvas} name="theme-color" />
        <meta content={webDocumentMetaDescription} name="description" />
        <ScrollViewStyleReset />
      </head>
      <body style={{ backgroundColor: colors.canvas }}>{children}</body>
    </html>
  );
}

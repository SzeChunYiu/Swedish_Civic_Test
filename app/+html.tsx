import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

import { colors } from '../lib/theme';

export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html data-app-shell="expo-router" lang="sv">
      <head>
        <meta charSet="utf-8" />
        <meta content="IE=edge" httpEquiv="X-UA-Compatible" />
        <meta content="width=device-width, initial-scale=1, viewport-fit=cover" name="viewport" />
        <meta content={colors.canvas} name="theme-color" />
        <meta
          content="Practice Swedish civic knowledge with offline quizzes, local progress, and source references."
          name="description"
        />
        <ScrollViewStyleReset />
      </head>
      <body style={{ backgroundColor: colors.canvas }}>{children}</body>
    </html>
  );
}

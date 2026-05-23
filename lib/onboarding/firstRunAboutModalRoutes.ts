export const FIRST_RUN_ABOUT_MODAL_SUPPRESSED_PATH_PREFIXES = [
  '/exam',
  '/quiz',
  '/(auth)',
  '/about-the-test',
  '/onboarding',
  '/privacy',
  '/terms',
  '/disclaimer',
  '/sources',
  '/support',
] as const;

function normalizePathname(pathname: string | null | undefined): string {
  if (!pathname) return '';
  const [withoutHash] = pathname.trim().split('#');
  const [withoutQuery] = withoutHash.split('?');
  if (!withoutQuery) return '';
  const withLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  return withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, '') : withLeadingSlash;
}

function matchesPathPrefix(pathname: string, prefix: string): boolean {
  if (pathname === prefix) return true;
  return pathname.startsWith(`${prefix}/`);
}

export function shouldSuppressFirstRunAboutModalForPath(
  pathname: string | null | undefined,
  suppressedPathPrefixes: readonly string[] = FIRST_RUN_ABOUT_MODAL_SUPPRESSED_PATH_PREFIXES,
): boolean {
  const normalizedPathname = normalizePathname(pathname);
  if (!normalizedPathname) return false;
  return suppressedPathPrefixes.some((prefix) =>
    matchesPathPrefix(normalizedPathname, normalizePathname(prefix)),
  );
}

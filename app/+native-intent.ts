type RedirectSystemPathEvent = {
  initial: boolean;
  path: string;
};

const APP_LINK_BASE = 'swedish-civic-test://app';

const staticRoutes = new Set([
  '/',
  '/disclaimer',
  '/exam',
  '/home',
  '/learn',
  '/mistakes',
  '/onboarding',
  '/practice',
  '/privacy',
  '/profile',
  '/settings',
  '/sources',
  '/support',
  '/terms',
]);

const chapterRoutePattern = /^\/chapter\/ch\d{2}$/;
const quizRoutePattern = /^\/quiz\/[A-Za-z0-9_-]+$/;

function routeFromUrl(url: URL) {
  const hostPath = url.hostname && url.hostname !== 'app' ? `/${url.hostname}` : '';
  const pathname = `${hostPath}${url.pathname}`.replace(/\/{2,}/g, '/') || '/';

  return `${pathname}${url.search}${url.hash}`;
}

function routePath(route: string) {
  const [withoutHash] = route.split('#');
  const [pathname] = withoutHash.split('?');

  return pathname || '/';
}

function isKnownStudyRoute(route: string) {
  const pathname = routePath(route);

  return (
    staticRoutes.has(pathname) ||
    chapterRoutePattern.test(pathname) ||
    quizRoutePattern.test(pathname)
  );
}

export function redirectSystemPath({ path }: RedirectSystemPathEvent) {
  try {
    const trimmedPath = path.trim();

    if (!trimmedPath) {
      return '/home';
    }

    const route = trimmedPath.startsWith('/')
      ? trimmedPath
      : routeFromUrl(new URL(trimmedPath, APP_LINK_BASE));

    if (isKnownStudyRoute(route)) {
      return route;
    }

    return '/home';
  } catch {
    return '/home';
  }
}

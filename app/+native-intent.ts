import {
  expoRouterNativeIntentDynamicRoutes,
  expoRouterNativeIntentStaticRoutes,
  expoRouterShellContract,
} from '../lib/scaffold/routerShellManifest';

type RedirectSystemPathEvent = {
  initial: boolean;
  path: string;
};

const APP_SCHEME = `${expoRouterShellContract.appScheme}:`;
const APP_LINK_BASE = `${expoRouterShellContract.appScheme}://app`;
const protocolPattern = /^([A-Za-z][A-Za-z0-9+.-]*):/;

function escapeRegExp(literal: string) {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const staticRoutes = new Set<string>(expoRouterNativeIntentStaticRoutes);
const dynamicRoutePatterns = expoRouterNativeIntentDynamicRoutes.map(
  ({ route, parameterPatterns }) =>
    new RegExp(
      `^${route
        .split('/')
        .map((segment) => {
          const parameterName = segment.match(/^\[([^\]]+)\]$/)?.[1];
          const patternsByParameter: Readonly<Record<string, string>> = parameterPatterns;

          return parameterName ? `(${patternsByParameter[parameterName]})` : escapeRegExp(segment);
        })
        .join('/')}$`,
    ),
);

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
    staticRoutes.has(pathname) || dynamicRoutePatterns.some((pattern) => pattern.test(pathname))
  );
}

function explicitProtocol(path: string) {
  const match = path.match(protocolPattern);

  return match ? `${match[1].toLowerCase()}:` : null;
}

function routeFromNativeIntentPath(path: string) {
  if (path.startsWith('//')) {
    return null;
  }

  if (path.startsWith('/')) {
    return path;
  }

  const protocol = explicitProtocol(path);
  if (protocol && protocol !== APP_SCHEME) {
    return null;
  }

  return routeFromUrl(new URL(path, APP_LINK_BASE));
}

export function redirectSystemPath({ path }: RedirectSystemPathEvent) {
  try {
    const trimmedPath = path.trim();

    if (!trimmedPath) {
      return '/home';
    }

    const route = routeFromNativeIntentPath(trimmedPath);

    if (route && isKnownStudyRoute(route)) {
      return route;
    }

    return '/home';
  } catch {
    return '/home';
  }
}

export function decodeStaticPathname(pathname: string): string;

export function resolveStaticRequestPath(options: {
  root: string;
  pathname: string;
  indexFile?: string;
}): string;

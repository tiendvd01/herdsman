import { createContext, useContext } from 'react';

export const HomeDirectory = createContext<string | undefined>(undefined);

export function formatHomePath(path: string, home?: string): string {
  if (!path || !home?.startsWith('/')) return path;
  const directory = home.replace(/\/+$/, '');
  if (path === directory || path === directory + '/') return '~';
  return path.startsWith(directory + '/') ? '~' + path.slice(directory.length) : path;
}

export function usePathLabel() {
  const home = useContext(HomeDirectory);
  return (path: string) => formatHomePath(path, home);
}

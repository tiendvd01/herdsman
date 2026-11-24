import documentIcon from '@/assets/material-icons/document.svg';
import folderIcon from '@/assets/material-icons/folder-base.svg';

const icons = import.meta.glob<string>('/src/assets/material-icons/*.svg', {
  eager: true,
  import: 'default',
  query: '?url',
});

const filenames = new Map([
  ['dockerfile', 'docker'],
  ['.dockerignore', 'docker'],
  ['.gitignore', 'git'],
  ['.gitattributes', 'git'],
  ['.bashrc', 'console'],
  ['.zshrc', 'console'],
]);

const suffixes = new Map([
  ['d.ts', 'typescript-def'], ['ts', 'typescript'], ['mts', 'typescript'], ['cts', 'typescript'],
  ['tsx', 'react'], ['jsx', 'react'], ['js', 'javascript'], ['mjs', 'javascript'], ['cjs', 'javascript'],
  ['md', 'markdown'], ['markdown', 'markdown'], ['json', 'json'], ['jsonc', 'json'],
  ['rs', 'rust'], ['py', 'python'], ['go', 'go'], ['css', 'css'], ['html', 'html'],
  ['yaml', 'yaml'], ['yml', 'yaml'], ['toml', 'toml'], ['sh', 'console'], ['zsh', 'console'],
  ['png', 'image'], ['jpg', 'image'], ['jpeg', 'image'], ['svg', 'image'], ['gif', 'image'], ['webp', 'image'],
]);

export function materialFileIcon(name: string, directory: boolean) {
  if (directory) return folderIcon;
  const filename = name.toLowerCase();
  let icon = filenames.get(filename);
  for (let dot = filename.indexOf('.'); dot >= 0 && !icon; dot = filename.indexOf('.', dot + 1)) {
    icon = suffixes.get(filename.slice(dot + 1));
  }
  return icons[`/src/assets/material-icons/${icon}.svg`] ?? documentIcon;
}

import type { ThemedTokenWithVariants } from 'shiki';
import type { DiffLine } from '@/components/conversation/lineDiff';
import { loadCodeLanguage } from '@/lib/highlightCode';

export type PatchLine = DiffLine & { hunk?: number };

export async function highlightPatch(lines: PatchLine[], path: string, original = path) {
  const hunks = new Map<number, number[]>();
  for (const [index, line] of lines.entries()) {
    if (line.hunk === undefined) continue;
    const rows = hunks.get(line.hunk) ?? [];
    rows.push(index);
    hunks.set(line.hunk, rows);
  }
  const result = new Map<number, ThemedTokenWithVariants[]>();
  if (!hunks.size) return result;

  async function highlightSide(file: string, excluded: DiffLine['kind']) {
    const name = file.slice(file.lastIndexOf('/') + 1).toLowerCase();
    const lang = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : name;
    const { h, id } = await loadCodeLanguage(lang);
    if (id === 'text') return;
    for (const rows of hunks.values()) {
      const indices = rows.filter((index) => lines[index].kind !== excluded);
      if (!indices.length) continue;
      const code = indices.map((index) => lines[index].text).join('\n');
      const tokens = h.codeToTokensWithThemes(code, {
        lang: id, themes: { light: 'github-light', dark: 'github-dark' },
      });
      for (const [position, index] of indices.entries()) {
        if (excluded === 'add' && result.has(index)) continue;
        result.set(index, tokens[position] ?? []);
      }
    }
  }
  await highlightSide(path, 'del');
  if (lines.some((line) => line.kind === 'del')) await highlightSide(original, 'add');
  return result;
}

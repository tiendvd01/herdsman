import type { DiffLine } from './lineDiff';
import { highlightLines, languageForFile, type CodeToken } from '@/lib/highlightCode';

export async function highlightPatch(lines: DiffLine[], path: string, original = path) {
  const hunks = new Map<number, number[]>();
  for (const [index, line] of lines.entries()) {
    if (line.hunk === undefined) continue;
    const rows = hunks.get(line.hunk) ?? [];
    rows.push(index);
    hunks.set(line.hunk, rows);
  }
  const result = new Map<number, CodeToken[]>();
  if (!hunks.size) return result;

  async function highlightSide(file: string, excluded: DiffLine['kind']) {
    for (const rows of hunks.values()) {
      const path = lines[rows[0]].path ?? file;
      const indices = rows.filter((index) => lines[index].kind !== excluded);
      if (!indices.length) continue;
      const support = await languageForFile(path);
      if (!support) continue;
      const code = indices.map((index) => lines[index].text).join('\n');
      const tokens = highlightLines(code, support);
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

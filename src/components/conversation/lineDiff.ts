// Diff theo dòng (LCS) cho Edit/Write — đủ cho đoạn sửa của agent, không cần thư viện nặng.
export type DiffLine = { kind: 'ctx' | 'add' | 'del'; text: string };

export function lineDiff(before: string, after: string): DiffLine[] {
  const a = before.split('\n');
  const b = after.split('\n');
  if (a.length * b.length > 4_000_000) return [...a.map((t) => ({ kind: 'del' as const, text: t })), ...b.map((t) => ({ kind: 'add' as const, text: t }))];
  const n = a.length;
  const m = b.length;
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ kind: 'ctx', text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) out.push({ kind: 'del', text: a[i++] });
    else out.push({ kind: 'add', text: b[j++] });
  }
  while (i < n) out.push({ kind: 'del', text: a[i++] });
  while (j < m) out.push({ kind: 'add', text: b[j++] });
  return out;
}

/** Diff dựng từ input của tool sửa file; null nếu tool không sửa file. */
export function toolDiff(tool: string, input: Record<string, unknown>): { file: string; lines: DiffLine[] } | null {
  const file = String(input.file_path ?? input.path ?? '');
  if (tool === 'Edit' && typeof input.old_string === 'string') return { file, lines: lineDiff(input.old_string, String(input.new_string ?? '')) };
  if (tool === 'Write' && typeof input.content === 'string') return { file, lines: input.content.split('\n').map((t) => ({ kind: 'add', text: t })) };
  if (tool === 'MultiEdit' && Array.isArray(input.edits)) {
    const lines: DiffLine[] = [];
    for (const e of input.edits as { old_string: string; new_string: string }[]) {
      if (lines.length) lines.push({ kind: 'ctx', text: '⋯' });
      lines.push(...lineDiff(e.old_string ?? '', e.new_string ?? ''));
    }
    return { file, lines };
  }
  return null;
}

import { describe, expect, it } from 'vitest';
import { lineDiff, toolDiff } from '@/components/conversation/lineDiff';

describe('lineDiff', () => {
  it('dòng giữ nguyên, thêm, xoá', () => {
    const d = lineDiff('a\nb\nc', 'a\nB\nc\nd');
    expect(d.map((l) => `${l.kind}:${l.text}`)).toEqual(['ctx:a', 'del:b', 'add:B', 'ctx:c', 'add:d']);
  });
  it('dựng diff từ input của Edit/Write; tool khác thì null', () => {
    expect(toolDiff('Edit', { file_path: 'f', old_string: 'x', new_string: 'y' })?.lines).toHaveLength(2);
    expect(toolDiff('Write', { file_path: 'f', content: '1\n2' })?.lines.every((l) => l.kind === 'add')).toBe(true);
    expect(toolDiff('Bash', { command: 'ls' })).toBeNull();
  });
});

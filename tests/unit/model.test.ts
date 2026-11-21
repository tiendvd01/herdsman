import { describe, expect, it } from 'vitest';
import { findModel, formatModel, modelLabel } from '@/lib/model';
import type { ModelOption } from '@/lib/types';

const models: ModelOption[] = [
  { value: 'default', display_name: 'Default (recommended)', description: '' },
  { value: 'sonnet', display_name: 'Sonnet', description: 'Fast', resolved_model: 'claude-sonnet-5-5' },
  { value: 'claude-haiku-5-5', display_name: 'Haiku 5.5', description: 'Fastest' },
];

describe('modelLabel', () => {
  it('id đầy đủ → tên gọn', () => {
    expect(formatModel('claude-opus-5-5')).toBe('Opus 5.5');
    expect(modelLabel('claude-opus-5-5')).toBe('Opus 5.5');
  });
  it('khớp value trong danh sách', () => {
    expect(modelLabel('claude-haiku-5-5', models)).toBe('Haiku 5.5');
    expect(modelLabel('sonnet', models)).toBe('Sonnet');
  });
  it('khớp alias qua resolved_model', () => {
    expect(findModel('claude-sonnet-5-5', models)?.value).toBe('sonnet');
    expect(modelLabel('claude-sonnet-5-5', models)).toBe('Sonnet');
  });
  it('null hoặc rỗng → Default', () => {
    expect(modelLabel(null)).toBe('Default');
    expect(modelLabel('')).toBe('Default');
  });
  it('tên lạ hiện nguyên văn', () => {
    expect(modelLabel('gpt-x', models)).toBe('gpt-x');
  });
});

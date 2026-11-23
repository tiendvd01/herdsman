import { describe, expect, it } from 'vitest';
import { MAX_SCALE, MIN_SCALE, centerOffset, clampScale, fitScale, zoomAt } from '@/components/conversation/mermaidZoom';

describe('mermaidZoom', () => {
  it('clampScale giữ trong [0.25, 8]', () => {
    expect(clampScale(0.01)).toBe(MIN_SCALE);
    expect(clampScale(100)).toBe(MAX_SCALE);
    expect(clampScale(2)).toBe(2);
    expect(clampScale(NaN)).toBe(1);
  });
  it('fitScale lấy tỉ lệ nhỏ hơn (rộng / cao)', () => {
    expect(fitScale(1000, 500, 2000, 100, 0)).toBeCloseTo(0.5);
    expect(fitScale(1000, 500, 100, 1000, 0)).toBeCloseTo(0.5);
    expect(fitScale(0, 0, 100, 100)).toBe(1);
  });
  it('centerOffset căn giữa', () => {
    expect(centerOffset(1000, 500, 200, 100, 1)).toEqual({ tx: 400, ty: 200 });
  });
  it('zoomAt giữ nguyên điểm neo', () => {
    const v = { scale: 1, tx: 10, ty: 20 };
    const n = zoomAt(v, 2, 100, 100);
    expect(n.scale).toBe(2);
    // điểm trong nội dung dưới con trỏ: (100 - tx) / scale phải giữ nguyên
    expect((100 - n.tx) / n.scale).toBeCloseTo((100 - v.tx) / v.scale);
    expect((100 - n.ty) / n.scale).toBeCloseTo((100 - v.ty) / v.scale);
  });
  it('zoomAt chặn ở giới hạn', () => {
    expect(zoomAt({ scale: MAX_SCALE, tx: 0, ty: 0 }, 2, 0, 0).scale).toBe(MAX_SCALE);
  });
});

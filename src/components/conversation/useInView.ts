import { useEffect, useRef, useState } from 'react';

/** true khi phần tử vào (gần) khung nhìn — để render Mermaid/chart lười (SC-006). */
export function useInView<T extends Element>(margin = '200px') {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setSeen(true), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [margin, seen]);
  return [ref, seen] as const;
}

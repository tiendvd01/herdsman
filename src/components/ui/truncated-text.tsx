import { useCallback, useRef, useState, type HTMLAttributes } from 'react';
import { Tooltip } from '@/components/ui/tooltip';

type TruncatedTextProps = HTMLAttributes<HTMLElement> & { as?: 'span' | 'li' };

export function TruncatedText({ as: Tag = 'span', children, ...props }: TruncatedTextProps) {
  const label = useRef<HTMLElement | null>(null);
  const setLabel = useCallback((element: HTMLElement | null) => { label.current = element; }, []);
  const [open, setOpen] = useState(false);

  return (
    <Tooltip
      open={open}
      onOpenChange={(nextOpen) => {
        const element = label.current;
        setOpen(nextOpen && !!element && (
          element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight
        ));
      }}
      disableHoverableContent
      content={children}
      contentClassName="pointer-events-none max-w-[min(28rem,90vw)] whitespace-pre-wrap [overflow-wrap:anywhere]"
    >
      <Tag {...props} ref={setLabel} title="">{children}</Tag>
    </Tooltip>
  );
}

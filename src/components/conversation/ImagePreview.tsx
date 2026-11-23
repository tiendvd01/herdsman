import { TruncatedText } from '@/components/ui/truncated-text';
import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type ImageSelection = { src: string; label: string; trigger: HTMLButtonElement };

export function ImagePreview({ image, onClose }: { image: ImageSelection | null; onClose: () => void }) {
  const [failedSrc, setFailedSrc] = useState<string>();
  return (
    <Dialog open={image !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      {image && (
        <DialogContent
          className="top-1/2 max-h-[calc(100%-32px)] w-[min(960px,calc(100%-32px))] -translate-y-1/2 p-4"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            image.trigger.focus({ preventScroll: true });
          }}
        >
          <DialogHeader title={<TruncatedText className="block truncate">{image.label}</TruncatedText>} />
          {failedSrc === image.src ? <p role="status">Image unavailable</p> : (
            <img
              src={image.src}
              alt={image.label}
              className="mx-auto min-h-0 max-w-full shrink object-contain"
              onError={() => setFailedSrc(image.src)}
            />
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}

export function ImageThumbnail({ src, label, caption, className, onSelect }: {
  src: string;
  label: string;
  caption?: string;
  className?: string;
  onSelect: (image: ImageSelection) => void;
}) {
  const [failedSrc, setFailedSrc] = useState<string>();
  if (failedSrc === src) return <UnavailableImage label={label} />;
  return (
    <button
      type="button"
      aria-label={`View ${label}`}
      className={cn('inline-flex shrink-0 cursor-pointer overflow-hidden rounded outline outline-1 outline-transparent focus-visible:outline-2 focus-visible:outline-foreground', className)}
      onClick={(event) => onSelect({ src, label, trigger: event.currentTarget })}
    >
      <img src={src} alt="" className={cn('object-cover', caption ? 'size-5 rounded' : 'size-full')} onError={() => setFailedSrc(src)} />
      {caption && <TruncatedText className="max-w-[160px] truncate font-mono">{caption}</TruncatedText>}
    </button>
  );
}

export function UnavailableImage({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted-foreground">
      <ImageIcon aria-hidden="true" className="size-4" /> {label}: Image unavailable
    </span>
  );
}

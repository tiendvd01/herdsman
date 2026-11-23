import { TooltipProvider } from '@/components/ui/tooltip';
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { HistoryImage } from '@/components/conversation/MessageList';
import { ImagePreview, type ImageSelection } from '@/components/conversation/ImagePreview';

vi.mock('@/lib/api', () => ({
  api: {
    sessionImage: vi.fn(async (_sessionId: string, id: string) => {
      if (id === 'missing') throw new Error('Image unavailable');
      return id === 'first' ? 'AQID' : 'BAUG';
    }),
  },
}));

it('opens the selected history image and handles old, missing and corrupt attachments', async () => {
  const client = new QueryClient();
  function Images() {
    const [selection, select] = useState<ImageSelection | null>(null);
    return (
      <>
        {['first', 'second', 'missing', undefined].map((id, index) => (
          <HistoryImage
            key={index}
            sessionId="session-1"
            image={{ media_type: 'image/png', attachment_id: id }}
            label={`Image ${index + 1}`}
            onSelect={select}
          />
        ))}
        <ImagePreview image={selection} onClose={() => select(null)} />
      </>
    );
  }
  render(<QueryClientProvider client={client}><TooltipProvider><Images /></TooltipProvider></QueryClientProvider>);
  const second = await screen.findByRole('button', { name: 'View Image 2' });
  fireEvent.click(second);
  expect(screen.getByRole('img', { name: 'Image 2' }).getAttribute('src')).toBe('data:image/png;base64,BAUG');
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.queryByRole('dialog')).toBeNull();

  const first = screen.getByRole('button', { name: 'View Image 1' });
  fireEvent.error(first.querySelector('img')!);
  expect(screen.getByText('Image 1: Image unavailable')).toBeTruthy();
  expect(await screen.findByText('Image 3: Image unavailable')).toBeTruthy();
  expect(screen.getByText('Image 4: Image unavailable')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'View Image 2' })).toBeTruthy();
  expect(api.sessionImage).toHaveBeenCalledTimes(3);
});

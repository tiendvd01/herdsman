import type { ComponentProps } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;
export const TabsContent = TabsPrimitive.Content;

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn('inline-flex h-9 items-center gap-0.5 rounded-lg bg-muted p-0.5', className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return <TabsPrimitive.Trigger className={cn('inline-flex h-7 items-center gap-1.5 rounded-md border border-transparent px-2 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground [&_svg]:size-4', className)} {...props} />;
}

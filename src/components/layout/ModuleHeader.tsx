export function ModuleHeader({ id, title }: { id: string; title: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center border-b border-border px-4">
      <h1 id={id} className="text-sm font-semibold">{title}</h1>
    </header>
  );
}

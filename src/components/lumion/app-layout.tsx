import { BottomNav } from '@/components/lumion/bottom-nav';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <div className="flex-grow container mx-auto px-4 py-8 pb-24 max-w-lg">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}

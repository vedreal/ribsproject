import { BottomNav } from '@/components/ribs/bottom-nav';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <main className="flex-grow container mx-auto px-4 py-8 pb-24 max-w-lg">
        {children}
      </main>
      <footer className="fixed bottom-4 inset-x-0 z-50">
        <div className="container mx-auto px-4 max-w-lg">
          <BottomNav />
        </div>
      </footer>
    </div>
  );
}

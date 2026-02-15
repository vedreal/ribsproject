import { BottomNav } from '@/components/ribs/bottom-nav';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-bottom-gradient flex flex-col min-h-dvh">
      <main className="relative z-10 flex-grow container mx-auto px-4 py-8 pb-24 max-w-lg">
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

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { TelegramProvider } from '@/components/telegram-provider';

export const metadata: Metadata = {
  title: 'RIBS Farm',
  description: 'Farm RIBS coins in the new Telegram mini-app.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark text-lg">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground selection:bg-primary/20">
        <TelegramProvider>
          {children}
        </TelegramProvider>
        <Toaster />
      </body>
    </html>
  );
}

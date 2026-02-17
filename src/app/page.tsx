'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RibsIcon } from '@/components/ribs/ribs-icon';
import { Progress } from '@/components/ui/progress';

export default function LoadingPage() {
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prevProgress + 10;
      });
    }, 200);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      setTimeout(() => {
        router.push('/farm');
      }, 500);
    }
  }, [progress, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-background">
      <div className="flex flex-col items-center gap-6">
        <RibsIcon className="w-24 h-24" />
        <div className="w-64">
          <Progress value={progress} className="h-3" />
        </div>
      </div>
    </div>
  );
}

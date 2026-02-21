import Image from 'next/image';
import { cn } from '@/lib/utils';

const RIBS_ICON_URL =
  'https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafybeiginxdxwz5a4leaap5oxpcjqq3ammum5wssxuiqoenajf4loio7ce';

interface RibsIconProps {
  className?: string;
}

export function RibsIcon({ className }: RibsIconProps) {
  // Parse size from Tailwind className (e.g. "w-4 h-4", "w-6 h-6", "w-10 h-10")
  // Falls back to 24px if not detected
  const match = className?.match(/w-(\d+)/);
  const tailwindSize = match ? parseInt(match[1]) : 6;
  // Tailwind spacing unit = 4px
  const px = tailwindSize * 4;

  return (
    <span className={cn('inline-flex items-center justify-center shrink-0', className)}>
      <Image
        src={RIBS_ICON_URL}
        alt="RIBS"
        width={px}
        height={px}
        className="object-contain"
        style={{ width: '100%', height: '100%' }}
      />
    </span>
  );
}

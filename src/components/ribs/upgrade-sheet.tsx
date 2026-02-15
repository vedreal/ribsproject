'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { upgrades as initialUpgrades, type Upgrade } from '@/lib/data';
import { useState, useEffect } from 'react';
import { RibsIcon } from './ribs-icon';
import { toast } from '@/hooks/use-toast';
import { Flame, Zap, Gem } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const iconMap: { [key: string]: React.FC<any> } = {
    'farming-rate': Flame,
    'tap-power': Zap,
    'tap-energy': Gem,
};

export function UpgradeSheet({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const [upgrades, setUpgrades] = useState<Upgrade[]>(initialUpgrades);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleUpgrade = (upgradeId: string) => {
    // In a real app, you'd check if the user has enough coins
    // and make an API call. Here we just show a toast.
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if(upgrade) {
        toast({
            title: `Upgraded ${upgrade.name}!`,
            description: `You've successfully upgraded to level ${upgrade.level + 1}.`,
        });
        // You could optimistically update the UI here.
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-lg w-full flex flex-col p-0">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="font-headline text-3xl">Upgrades</SheetTitle>
          <SheetDescription>
            Increase your RIBS income by upgrading your farm.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="space-y-4 px-6 pb-6">
            {upgrades.map((upgrade) => {
              const Icon = iconMap[upgrade.id] || Gem;
              return (
              <div key={upgrade.id} className="bg-card/50 rounded-lg p-4 space-y-4 border">
                <div className="flex items-center gap-3">
                  <Icon className="w-8 h-8 text-accent" />
                  <div>
                    <h3 className="font-headline text-xl font-semibold leading-none tracking-tight">{upgrade.name}</h3>
                    <p className="text-sm text-muted-foreground">{upgrade.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm min-h-[20px]">
                      <span>Level {upgrade.level} / {upgrade.maxLevel}</span>
                      <span className="font-bold text-primary">{upgrade.benefit}</span>
                  </div>
                  <Progress value={(upgrade.level / upgrade.maxLevel) * 100} className="h-2" />
                </div>
                <Button className="w-full font-bold" onClick={() => handleUpgrade(upgrade.id)} disabled={upgrade.level >= upgrade.maxLevel}>
                    {upgrade.level >= upgrade.maxLevel ? 'Max Level' : (
                        <>
                            Upgrade for <RibsIcon className="w-4 h-4 inline-block mx-1" /> {isMounted ? upgrade.cost.toLocaleString() : upgrade.cost.toLocaleString('en-US')}
                        </>
                    )}
                </Button>
              </div>
            )})}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

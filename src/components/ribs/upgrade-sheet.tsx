'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <SheetContent className="max-w-lg w-full flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-headline text-3xl">Upgrades</SheetTitle>
          <SheetDescription>
            Increase your RIBS income by upgrading your farm.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="py-4 space-y-4 pr-6">
            {upgrades.map((upgrade) => {
              const Icon = iconMap[upgrade.id] || Gem;
              return (
              <Card key={upgrade.id} className="bg-card/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className="w-8 h-8 text-accent" />
                    <div>
                      <CardTitle className="font-headline text-xl">{upgrade.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{upgrade.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`flex items-center text-sm min-h-[20px] ${upgrade.id === 'tap-power' ? 'justify-end' : 'justify-between'}`}>
                      {upgrade.id !== 'tap-power' &&
                          <span>Level {upgrade.level} / {upgrade.maxLevel}</span>
                      }
                      <span className="font-bold text-primary">{upgrade.benefit}</span>
                  </div>
                  {upgrade.id !== 'tap-power' &&
                      <Progress value={(upgrade.level / upgrade.maxLevel) * 100} className="h-2" />
                  }
                  <Button className="w-full font-bold" onClick={() => handleUpgrade(upgrade.id)} disabled={upgrade.level >= upgrade.maxLevel}>
                      {upgrade.level >= upgrade.maxLevel ? 'Max Level' : (
                          <>
                              Upgrade for <RibsIcon className="w-4 h-4 inline-block mx-1" /> {isMounted ? upgrade.cost.toLocaleString() : upgrade.cost.toLocaleString('en-US')}
                          </>
                      )}
                  </Button>
                </CardContent>
              </Card>
            )})}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

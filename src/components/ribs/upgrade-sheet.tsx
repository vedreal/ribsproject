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
import { type Upgrade } from '@/lib/data';
import { RibsIcon } from './ribs-icon';
import { Flame, Zap, Gem } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const iconMap: { [key: string]: React.FC<any> } = {
    'faucet-rate': Flame,
    'tap-power': Zap,
    'tap-energy': Gem,
};

export function UpgradeSheet({
  isOpen,
  onOpenChange,
  upgrades,
  handleUpgrade,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  upgrades: Upgrade[];
  handleUpgrade: (upgradeId: string) => void;
}) {

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-lg flex flex-col p-0">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="font-headline text-3xl">Upgrades</SheetTitle>
          <SheetDescription>
            Increase your RIBS income by upgrading your faucet.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="space-y-4 px-6 pb-6">
            {upgrades.map((upgrade) => {
              const Icon = iconMap[upgrade.id] || Gem;
              const currentLevel = upgrade.level;
              const maxLevel = upgrade.maxLevel;
              const cost = upgrade.costs[currentLevel-1] || 0;
              const benefit = upgrade.benefits[currentLevel-1] || upgrade.benefits[upgrade.benefits.length-1];

              return (
              <div key={upgrade.id} className="bg-gradient-to-br from-secondary to-card border border-border rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Icon className="w-8 h-8 text-accent" />
                  <div>
                    <h3 className="font-headline text-xl font-semibold leading-none tracking-tight">{upgrade.name}</h3>
                    <p className="text-sm text-muted-foreground">{upgrade.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm min-h-[20px]">
                      <span>Level {currentLevel} / {maxLevel}</span>
                      <span className="font-bold text-primary">{benefit}</span>
                  </div>
                   <Progress value={(currentLevel / maxLevel) * 100} className="h-2" />
                </div>
                <Button className="w-full font-bold bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 hover:brightness-95" onClick={() => handleUpgrade(upgrade.id)} disabled={currentLevel >= maxLevel}>
                    {currentLevel >= maxLevel ? 'Max Level' : (
                        <>
                            Upgrade for <RibsIcon className="w-4 h-4 inline-block mx-1" /> {cost.toLocaleString()}
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

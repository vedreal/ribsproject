import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/ribs/app-layout';
import { tasks } from '@/lib/data';
import { RibsIcon } from '@/components/ribs/ribs-icon';

export default function TasksPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-headline font-bold">Tasks</h1>
          <p className="text-muted-foreground">Complete tasks to earn more RIBS.</p>
        </header>

        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-gradient-to-br from-secondary to-card border border-border rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                        <task.Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <p className="font-semibold">{task.title}</p>
                        <div className="flex items-center gap-1 text-sm text-primary">
                            <RibsIcon className="w-3 h-3"/>
                            <span>+ {task.reward.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <Button asChild variant="secondary">
                    <Link href={task.href} target="_blank">Go</Link>
                </Button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

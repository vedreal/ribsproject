import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/lumion/app-layout';
import { tasks } from '@/lib/data';
import { LumionIcon } from '@/components/lumion/lumion-icon';

export default function TasksPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-headline font-bold">Tasks</h1>
          <p className="text-muted-foreground">Complete tasks to earn more LUMION.</p>
        </header>

        <div className="space-y-4">
          {tasks.map((task) => (
            <Card key={task.id}>
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg">
                            <task.Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold">{task.title}</p>
                            <div className="flex items-center gap-1 text-sm text-primary">
                                <LumionIcon className="w-3 h-3"/>
                                <span>+ {task.reward.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    <Button asChild variant="secondary">
                        <Link href={task.href} target="_blank">Go</Link>
                    </Button>
                </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

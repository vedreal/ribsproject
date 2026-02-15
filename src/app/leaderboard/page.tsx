import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/ribs/app-layout';
import { leaderboardData } from '@/lib/data';
import { cn } from '@/lib/utils';
import { RibsIcon } from '@/components/ribs/ribs-icon';

export default function LeaderboardPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-headline font-bold">Rank</h1>
          <p className="text-muted-foreground">See the current player rankings.</p>
        </header>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">RIBS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboardData.map((user) => (
                  <TableRow
                    key={user.rank}
                    className={cn(
                      user.isCurrentUser &&
                        'bg-primary/10 hover:bg-primary/20'
                    )}
                  >
                    <TableCell className="font-medium text-lg">{user.rank}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image
                          src={`https://picsum.photos/seed/${user.avatarSeed}/40/40`}
                          alt={user.username}
                          width={40}
                          height={40}
                          className="rounded-full"
                          data-ai-hint="avatar"
                        />
                        <span className="font-medium">{user.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 font-semibold">
                       <RibsIcon className="w-4 h-4" /> {user.ribs.toLocaleString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

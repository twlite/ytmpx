import React from 'react';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './ui/empty';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Music, Play } from 'lucide-react';

export const EmptyState: React.FC = () => {
  return (
    <Card className="w-full bg-card/95 backdrop-blur-sm border-border/50 shadow-xl">
      <div className="p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Music className="size-12 text-muted-foreground" />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyTitle>No track playing</EmptyTitle>
          <EmptyDescription>
            Start playing a song on YouTube Music to see track information here
          </EmptyDescription>
          <EmptyContent>
            <Button variant="outline" className="gap-2">
              <Play className="size-4" />
              Go to YouTube Music
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </Card>
  );
};

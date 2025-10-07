import React from 'react';
import type { Metadata } from '../types/metadata';
import { Play, Pause } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

interface TrackCardProps {
  metadata: Metadata;
  isPlaying: boolean;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  metadata,
  isPlaying,
}) => {
  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatProgress = (current: number, total: number): string => {
    if (total === 0) return '0:00 / 0:00';
    return `${formatDuration(current)} / ${formatDuration(total)}`;
  };

  const progressPercentage =
    metadata.totalDuration > 0
      ? (metadata.currentDuration / metadata.totalDuration) * 100
      : 0;

  return (
    <Card className="w-full bg-card/95 backdrop-blur-sm border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardContent className="p-6">
        {/* Album Art */}
        <div className="text-center mb-6">
          <div className="relative inline-block group">
            <Avatar className="w-28 h-28 mx-auto shadow-lg rounded-sm ring-2 ring-border/20 group-hover:scale-105 transition-transform duration-300">
              <AvatarImage
                src={metadata.image || undefined}
                alt="Track thumbnail"
                className="object-cover"
              />
              <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                YT
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent group-hover:from-black/10 transition-all duration-300 pointer-events-none"></div>
          </div>
        </div>

        {/* Track Info */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-foreground mb-2 leading-tight line-clamp-2">
            {metadata.title || 'No track playing'}
          </h3>
          <p className="text-muted-foreground text-sm">
            {metadata.author || 'Start playing a song on YouTube Music'}
          </p>
        </div>

        {/* Only show progress section if there's actual track data */}
        {metadata.title && metadata.author && (
          <>
            <Separator className="mb-6" />

            {/* Progress Section */}
            <div className="space-y-4">
              <Progress
                value={progressPercentage}
                className="h-2 bg-muted transition-all duration-300"
              />

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-mono">
                  {formatProgress(
                    metadata.currentDuration,
                    metadata.totalDuration
                  )}
                </span>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={isPlaying ? 'default' : 'secondary'}
                    className={`${
                      isPlaying
                        ? 'bg-green-500/20 text-green-600 hover:bg-green-500/30'
                        : 'bg-orange-500/20 text-orange-600 hover:bg-orange-500/30'
                    } border-0`}
                  >
                    <div className="flex items-center gap-1.5">
                      {isPlaying ? (
                        <Play className="w-3 h-3" />
                      ) : (
                        <Pause className="w-3 h-3" />
                      )}
                      <span className="text-xs font-medium">
                        {isPlaying ? 'Playing' : 'Paused'}
                      </span>
                    </div>
                  </Badge>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

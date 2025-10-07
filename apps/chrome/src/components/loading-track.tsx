import React from 'react';
import { Spinner } from './ui/spinner';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Separator } from './ui/separator';

export const Loading: React.FC = () => {
  return (
    <Card className="w-full bg-card/95 backdrop-blur-sm border-border/50 shadow-xl">
      <CardContent className="p-6">
        {/* Album Art Skeleton */}
        <div className="text-center mb-6">
          <Skeleton className="w-28 h-28 rounded-xl mx-auto" />
        </div>

        {/* Track Info Skeleton */}
        <div className="text-center mb-6">
          <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </div>

        <Separator className="mb-6" />

        {/* Progress Section Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-2 w-full rounded-full" />

          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>

        {/* Loading Alert */}
        <Alert className="mt-6">
          <Spinner className="size-4" />
          <AlertTitle>Loading track...</AlertTitle>
          <AlertDescription>
            Fetching your current track information from YouTube Music
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

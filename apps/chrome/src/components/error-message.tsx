import React from 'react';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Card, CardContent } from './ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorProps {
  message: string;
  onRetry: () => void;
  loading: boolean;
}

export const Error: React.FC<ErrorProps> = ({ message, onRetry, loading }) => {
  return (
    <Card className="w-full bg-card/95 backdrop-blur-sm border-border/50 shadow-xl">
      <CardContent className="p-6">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="size-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="mt-2">{message}</AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <Button
            onClick={onRetry}
            disabled={loading}
            variant="outline"
            className="gap-2"
          >
            {loading ? (
              <Spinner className="size-4" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {loading ? 'Retrying...' : 'Try Again'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

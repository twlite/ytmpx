export interface Metadata {
  author: string;
  url: string;
  title: string;
  totalDuration: number; // milliseconds
  currentDuration: number; // milliseconds
  image: string | null; // image/thumbnail of the track (if not available then null)
  artistUrl: string | null; // URL to the artist's channel (if not available then null)
}

export interface TrackInfo {
  metadata: Metadata;
  isPlaying: boolean;
  timestamp: number;
}

import type { Metadata } from '../types/metadata';

export class YouTubeMusicDetector {
  private static readonly SELECTORS = {
    title: 'ytmusic-player-bar yt-formatted-string.title',
    artist: 'ytmusic-player-bar yt-formatted-string.byline',
    artistUrl:
      'ytmusic-player-bar yt-formatted-string.byline a.yt-simple-endpoint',
    progressBar: 'ytmusic-player-bar tp-yt-paper-slider#progress-bar',
    thumbnail: 'ytmusic-player-bar img.image',
    playButton: 'ytmusic-player-bar yt-icon-button#play-pause-button',
    currentTime: 'ytmusic-player-bar .time-info .current-time',
    duration: 'ytmusic-player-bar .time-info .duration',
  };

  private static readonly ALTERNATIVE_SELECTORS = {
    title: [
      'ytmusic-player-bar .title',
      'ytmusic-player-bar [class*="title"]',
      '.ytmusic-player-bar .title',
      'yt-formatted-string.title',
    ],
    artist: [
      'ytmusic-player-bar .byline',
      'ytmusic-player-bar [class*="byline"]',
      '.ytmusic-player-bar .byline',
      'yt-formatted-string.byline',
    ],
    thumbnail: [
      'ytmusic-player-bar img',
      'ytmusic-player-bar img[src*="googleusercontent"]',
      '.ytmusic-player-bar img',
    ],
  };

  private static findElement(selectors: string[]): Element | null {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    }
    return null;
  }

  static extractMetadata(): Metadata {
    try {
      const titleElement = this.findElement([
        this.SELECTORS.title,
        ...this.ALTERNATIVE_SELECTORS.title,
      ]);

      const artistElement = this.findElement([
        this.SELECTORS.artist,
        ...this.ALTERNATIVE_SELECTORS.artist,
      ]);

      const progressBarElement = document.querySelector(
        this.SELECTORS.progressBar
      );

      const thumbnailElement = this.findElement([
        this.SELECTORS.thumbnail,
        ...this.ALTERNATIVE_SELECTORS.thumbnail,
      ]);

      const title = titleElement?.textContent?.trim() || '';

      // Extract artist names from <a> tags in byline (excluding album links)
      let author = '';
      if (artistElement) {
        const allLinks = artistElement.querySelectorAll('a');
        const artists: string[] = [];

        allLinks.forEach((link) => {
          const href = link.getAttribute('href') || '';
          const text = link.textContent?.trim() || '';

          // Only consider links that go to channels (artists), not albums or playlists
          // Channel links typically contain "channel/" in the URL
          if (href.includes('channel/') && text) {
            artists.push(text);
          }
        });

        // Join multiple artists with proper formatting
        if (artists.length === 0) {
          author = '';
        } else if (artists.length === 1) {
          author = artists[0];
        } else if (artists.length === 2) {
          author = artists.join(' & ');
        } else {
          // For 3+ artists: "Artist1, Artist2 & Artist3"
          const allButLast = artists.slice(0, -1).join(', ');
          const last = artists[artists.length - 1];
          author = `${allButLast} & ${last}`;
        }
      }

      // Extract first artist URL
      let artistUrl: string | null = null;
      if (artistElement) {
        let firstArtistLink = artistElement.querySelector(
          'a[href*="channel/"]'
        );

        // Fallback: try to find any link that looks like a channel
        if (!firstArtistLink) {
          firstArtistLink = artistElement.querySelector('a[href*="channel"]');
        }

        // Another fallback: try to find the first link
        if (!firstArtistLink) {
          firstArtistLink = artistElement.querySelector('a');
        }

        if (firstArtistLink) {
          const href = firstArtistLink.getAttribute('href');
          if (href) {
            // Convert relative URL to absolute URL
            if (href.startsWith('/')) {
              artistUrl = `https://music.youtube.com${href}`;
            } else if (href.startsWith('channel/')) {
              artistUrl = `https://music.youtube.com/${href}`;
            } else {
              artistUrl = href;
            }
          }
        }
      }

      const durationInfo = this.extractDurationInfo(progressBarElement);
      const image = thumbnailElement?.getAttribute('src') || null;

      const metadata: Metadata = {
        title,
        author,
        url: window.location.href,
        totalDuration: durationInfo.totalDuration,
        currentDuration: durationInfo.currentDuration,
        image: image ? this.upscaledImage(image) : null,
        artistUrl,
      };

      return metadata;
    } catch {
      return {
        title: '',
        author: '',
        url: window.location.href,
        totalDuration: 0,
        currentDuration: 0,
        image: null,
        artistUrl: null,
      };
    }
  }

  private static upscaledImage(image: string): string {
    const regex = /w\d+-h\d+-/;

    if (!regex.test(image)) return image;

    return image.replace(regex, 'w1024-h1024-');
  }

  static extractDurationInfo(progressBarElement: Element | null): {
    currentDuration: number;
    totalDuration: number;
  } {
    try {
      if (progressBarElement) {
        // Try to get from aria attributes first (most accurate)
        const ariaValueNow = progressBarElement.getAttribute('aria-valuenow');
        const ariaValueMax = progressBarElement.getAttribute('aria-valuemax');

        if (ariaValueNow && ariaValueMax) {
          const currentSeconds = parseInt(ariaValueNow, 10);
          const totalSeconds = parseInt(ariaValueMax, 10);

          return {
            currentDuration: currentSeconds * 1000, // Convert to milliseconds
            totalDuration: totalSeconds * 1000,
          };
        }

        // Fallback: try to parse aria-valuetext
        const ariaValueText = progressBarElement.getAttribute('aria-valuetext');
        if (ariaValueText) {
          // Parse format like "2 Minutes 28 Seconds of 3 Minutes 30 Seconds"
          const timeMatch = ariaValueText.match(
            /(\d+)\s+Minutes?\s+(\d+)\s+Seconds?\s+of\s+(\d+)\s+Minutes?\s+(\d+)\s+Seconds?/
          );
          if (timeMatch) {
            const currentMinutes = parseInt(timeMatch[1], 10);
            const currentSeconds = parseInt(timeMatch[2], 10);
            const totalMinutes = parseInt(timeMatch[3], 10);
            const totalSeconds = parseInt(timeMatch[4], 10);

            return {
              currentDuration: (currentMinutes * 60 + currentSeconds) * 1000,
              totalDuration: (totalMinutes * 60 + totalSeconds) * 1000,
            };
          }
        }
      }

      // Fallback: try to get from time display elements
      const timeInfoElement = document.querySelector(
        this.SELECTORS.currentTime
      );

      if (timeInfoElement) {
        const timeText = timeInfoElement.textContent || '';
        // Parse format like "0:06 / 3:40"
        const timeMatch = timeText.match(/(\d+:\d+)\s*\/\s*(\d+:\d+)/);
        if (timeMatch) {
          const currentTime = this.parseTimeString(timeMatch[1]);
          const totalTime = this.parseTimeString(timeMatch[2]);

          return {
            currentDuration: currentTime,
            totalDuration: totalTime,
          };
        }
      }

      return { currentDuration: 0, totalDuration: 0 };
    } catch {
      return { currentDuration: 0, totalDuration: 0 };
    }
  }

  private static parseTimeString(timeStr: string): number {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      return (minutes * 60 + seconds) * 1000; // Convert to milliseconds
    }

    return 0;
  }

  static isPlaying(): boolean {
    try {
      const playButton = document.querySelector(this.SELECTORS.playButton);
      if (playButton) {
        const button = playButton.querySelector('button');
        if (button) {
          const ariaLabel = button.getAttribute('aria-label');
          const title = playButton.getAttribute('title');
          // Check if it says "Pause" (playing) or "Play" (paused)
          return (
            ariaLabel?.toLowerCase().includes('pause') ||
            title?.toLowerCase().includes('pause') ||
            false
          );
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  static getCurrentTrackId(): string | null {
    try {
      // YouTube Music often uses video IDs in the URL or data attributes
      const url = window.location.href;

      // Try to extract video ID from URL
      const videoIdMatch = url.match(/[?&]v=([^&]+)/);
      if (videoIdMatch) {
        return videoIdMatch[1];
      }

      // Fallback: try to get from metadata
      const metadata = this.extractMetadata();
      if (metadata.title && metadata.author) {
        return `${metadata.title}-${metadata.author}`.replace(
          /[^a-zA-Z0-9]/g,
          '-'
        );
      }

      return null;
    } catch {
      return null;
    }
  }
}

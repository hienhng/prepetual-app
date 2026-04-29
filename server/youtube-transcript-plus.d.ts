declare module 'youtube-transcript-plus' {
  export interface TranscriptSegment {
    text: string;
    start: number;
    duration: number;
  }

  export interface FetchOptions {
    lang?: string;
    userAgent?: string;
  }

  export function fetchTranscript(
    videoId: string,
    options?: FetchOptions
  ): Promise<TranscriptSegment[]>;
}

declare module 'youtube-transcript-api' {
  export interface TranscriptSegment {
    text: string;
    start: number;
    duration: number;
  }

  export interface TranscriptResult {
    transcript: TranscriptSegment[];
  }

  export default class TranscriptClient {
    ready: Promise<void>;
    getTranscript(videoId: string): Promise<TranscriptResult>;
  }
}

declare module 'youtube-transcript-api' {
  export interface TranscriptSegment {
    text: string;
    start: string;
    dur: string;
  }

  export interface TranscriptTrack {
    language: string;
    transcript: TranscriptSegment[];
  }

  export interface TranscriptResult {
    id: string;
    tracks: TranscriptTrack[];
    languages: Array<{ label: string; languageCode: string }>;
  }

  export default class TranscriptClient {
    ready: Promise<void>;
    getTranscript(videoId: string): Promise<TranscriptResult>;
  }
}

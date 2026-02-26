export type SourceType = 'online' | 'local';

export interface Book {
  id: string;
  title: string;
  sourceType: SourceType;
  author?: string;
  cover?: string;
  sourceUrl?: string;
  localPath?: string;
  createdAt: number;
  updatedAt: number;
  chapterCount: number;
}

export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  index: number;
  sourceUrl?: string;
  sourceRef?: string;
  contentHash?: string;
  wordCount?: number;
}

export interface ReadingProgress {
  bookId: string;
  chapterId: string;
  offset: number;
  updatedAt: number;
}

export interface CacheEntry {
  key: string;
  bookId: string;
  chapterId: string;
  size: number;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
}

export interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  paragraphSpacing: number;
  contentWidth: number;
  stealthMode: boolean;
}

export interface ParserResult {
  bookMeta: {
    title: string;
    author?: string;
    cover?: string;
  };
  chapters: Array<{
    title: string;
    url: string;
  }>;
}

export interface ParserError {
  code: 'UNSUPPORTED_SITE' | 'PARSE_FAILED' | 'NETWORK_ERROR';
  message: string;
  url: string;
  siteKey?: string;
}

export interface PersistedState {
  books: Book[];
  chapters: Chapter[];
  progress: ReadingProgress[];
  cacheEntries: CacheEntry[];
  failedUrls: Array<{ url: string; reason: string; at: number }>;
  settings: ReaderSettings;
  recentBookIds: string[];
}

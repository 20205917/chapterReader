import * as fs from 'fs/promises';
import * as path from 'path';
import { Book, CacheEntry, Chapter, PersistedState, ReaderSettings, ReadingProgress } from '../types';

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.55,
  paragraphSpacing: 14,
  contentWidth: 900,
  stealthMode: false
};

const DEFAULT_STATE: PersistedState = {
  books: [],
  chapters: [],
  progress: [],
  cacheEntries: [],
  failedUrls: [],
  settings: DEFAULT_SETTINGS,
  recentBookIds: []
};

export class Store {
  private readonly filePath: string;
  private state: PersistedState = DEFAULT_STATE;

  constructor(storagePath: string) {
    this.filePath = path.join(storagePath, 'state.json');
  }

  async init(): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as PersistedState;
      this.state = {
        ...DEFAULT_STATE,
        ...parsed,
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings }
      };
    } catch {
      this.state = DEFAULT_STATE;
      await this.save();
    }
  }

  getState(): PersistedState {
    return JSON.parse(JSON.stringify(this.state));
  }

  getBook(bookId: string): Book | undefined {
    return this.state.books.find((b) => b.id === bookId);
  }

  listBooks(): Book[] {
    return [...this.state.books].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  listChapters(bookId: string): Chapter[] {
    return this.state.chapters
      .filter((c) => c.bookId === bookId)
      .sort((a, b) => a.index - b.index);
  }

  upsertBook(book: Book): void {
    const idx = this.state.books.findIndex((b) => b.id === book.id);
    if (idx >= 0) {
      this.state.books[idx] = book;
    } else {
      this.state.books.push(book);
    }
    this.touchRecent(book.id);
  }

  setBookChapters(bookId: string, chapters: Chapter[]): void {
    this.state.chapters = this.state.chapters.filter((c) => c.bookId !== bookId).concat(chapters);
  }

  removeBook(bookId: string): void {
    this.state.books = this.state.books.filter((b) => b.id !== bookId);
    this.state.chapters = this.state.chapters.filter((c) => c.bookId !== bookId);
    this.state.progress = this.state.progress.filter((p) => p.bookId !== bookId);
    this.state.recentBookIds = this.state.recentBookIds.filter((id) => id !== bookId);
  }

  setProgress(next: ReadingProgress): void {
    const idx = this.state.progress.findIndex((p) => p.bookId === next.bookId);
    if (idx >= 0) {
      this.state.progress[idx] = next;
    } else {
      this.state.progress.push(next);
    }
    this.touchRecent(next.bookId);
  }

  getProgress(bookId: string): ReadingProgress | undefined {
    return this.state.progress.find((p) => p.bookId === bookId);
  }

  getSettings(): ReaderSettings {
    return { ...this.state.settings };
  }

  setSettings(settings: ReaderSettings): void {
    this.state.settings = settings;
  }

  upsertCacheEntry(entry: CacheEntry): void {
    const idx = this.state.cacheEntries.findIndex((e) => e.key === entry.key);
    if (idx >= 0) {
      this.state.cacheEntries[idx] = entry;
    } else {
      this.state.cacheEntries.push(entry);
    }
  }

  listCacheEntries(): CacheEntry[] {
    return [...this.state.cacheEntries].sort((a, b) => a.updatedAt - b.updatedAt);
  }

  removeCacheEntry(key: string): void {
    this.state.cacheEntries = this.state.cacheEntries.filter((e) => e.key !== key);
  }

  clearCacheEntries(): void {
    this.state.cacheEntries = [];
  }

  addFailedUrl(url: string, reason: string): void {
    this.state.failedUrls.unshift({ url, reason, at: Date.now() });
    this.state.failedUrls = this.state.failedUrls.slice(0, 100);
  }

  private touchRecent(bookId: string): void {
    this.state.recentBookIds = [bookId, ...this.state.recentBookIds.filter((id) => id !== bookId)].slice(0, 50);
    const book = this.state.books.find((b) => b.id === bookId);
    if (book) {
      book.updatedAt = Date.now();
    }
  }

  async save(): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(this.state, null, 2), 'utf8');
  }
}

import { CacheService } from './cacheService';
import { LocalImporter } from './localImporter';
import { OnlineService } from './online/onlineService';
import { Store } from '../storage/store';
import { Chapter, ReaderSettings } from '../types';

export class ReaderService {
  readonly localImporter: LocalImporter;
  readonly onlineService: OnlineService;

  constructor(private readonly store: Store, private readonly cache: CacheService) {
    this.localImporter = new LocalImporter(store, cache);
    this.onlineService = new OnlineService(store, cache);
  }

  getSnapshot() {
    const state = this.store.getState();
    return {
      books: state.books,
      progress: state.progress,
      settings: state.settings,
      recentBookIds: state.recentBookIds,
      cacheStats: this.cache.getStats(),
      supportedSites: this.onlineService.listSupportedSites(),
      failedUrls: state.failedUrls.slice(0, 20)
    };
  }

  getChapters(bookId: string): Chapter[] {
    return this.store.listChapters(bookId);
  }

  async getChapterContent(bookId: string, chapterId: string): Promise<string> {
    const book = this.store.getBook(bookId);
    if (!book) {
      throw new Error('Book not found');
    }

    if (book.sourceType === 'local') {
      const cached = await this.cache.get(bookId, chapterId);
      if (!cached) {
        throw new Error('本地章节缓存丢失，请重新导入该书');
      }
      return cached;
    }

    return this.onlineService.loadChapterContent(bookId, chapterId);
  }

  async setProgress(bookId: string, chapterId: string, offset: number): Promise<void> {
    this.store.setProgress({ bookId, chapterId, offset, updatedAt: Date.now() });
    await this.store.save();
  }

  getProgress(bookId: string) {
    return this.store.getProgress(bookId);
  }

  async setSettings(settings: ReaderSettings): Promise<void> {
    this.store.setSettings(settings);
    await this.store.save();
  }

  async clearCache(): Promise<void> {
    await this.cache.clearAll();
  }

  async deleteBook(bookId: string): Promise<void> {
    await this.cache.clearBook(bookId);
    this.store.removeBook(bookId);
    await this.store.save();
  }
}

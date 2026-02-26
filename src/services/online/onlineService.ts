import * as crypto from 'crypto';
import { CacheService } from '../cacheService';
import { Store } from '../../storage/store';
import { Book, Chapter } from '../../types';
import { defaultParsers, SiteParser } from './parsers';

export class OnlineService {
  private readonly parsers: SiteParser[];
  private readonly inFlightLoads = new Map<string, Promise<string>>();

  constructor(private readonly store: Store, private readonly cache: CacheService) {
    this.parsers = defaultParsers();
  }

  listSupportedSites(): string[] {
    return this.parsers.map((p) => p.siteKey);
  }

  private parserOrder(url: string, preferredSiteKey?: string): SiteParser[] {
    const preferred = preferredSiteKey ? this.parsers.find((p) => p.siteKey === preferredSiteKey) : undefined;
    const match = this.parsers.filter((p) => p.canHandle(url) && p !== preferred);
    const rest = this.parsers.filter((p) => !match.includes(p) && p !== preferred);
    return preferred ? [preferred, ...match, ...rest] : [...match, ...rest];
  }

  async addBookByUrl(url: string): Promise<Book> {
    const now = Date.now();
    const bookId = crypto.createHash('sha1').update(`online:${url}`).digest('hex').slice(0, 16);
    const attempts: string[] = [];

    for (const parser of this.parserOrder(url)) {
      try {
        const parsed = await parser.parseBook(url);
        const chapters: Chapter[] = parsed.chapters.map((c, index) => ({
          id: crypto.createHash('sha1').update(c.url).digest('hex').slice(0, 16),
          bookId,
          title: c.title,
          index,
          sourceUrl: c.url,
          sourceRef: parser.siteKey
        }));

        const book: Book = {
          id: bookId,
          title: parsed.bookMeta.title,
          author: parsed.bookMeta.author,
          sourceType: 'online',
          sourceUrl: url,
          createdAt: now,
          updatedAt: now,
          chapterCount: chapters.length
        };

        this.store.upsertBook(book);
        this.store.setBookChapters(bookId, chapters);
        await this.store.save();
        return book;
      } catch (error) {
        attempts.push(`${parser.siteKey}: ${String(error)}`);
      }
    }

    const message = `解析失败，未找到有效目录。${attempts.length > 0 ? `尝试详情: ${attempts.join(' | ')}` : ''}`;
    this.store.addFailedUrl(url, message);
    await this.store.save();
    throw new Error(message);
  }

  async loadChapterContent(bookId: string, chapterId: string): Promise<string> {
    const key = `${bookId}:${chapterId}`;
    const pending = this.inFlightLoads.get(key);
    if (pending) {
      return pending;
    }

    const job = (async () => {
      const cached = await this.cache.get(bookId, chapterId);
      if (cached) {
        return cached;
      }

      const chapter = this.store.listChapters(bookId).find((c) => c.id === chapterId);
      if (!chapter || !chapter.sourceUrl) {
        throw new Error('章节不存在或缺少来源链接');
      }

      const attempts: string[] = [];
      for (const parser of this.parserOrder(chapter.sourceUrl, chapter.sourceRef)) {
        try {
          const content = await parser.parseChapter(chapter.sourceUrl);
          await this.cache.set(bookId, chapterId, content);
          return content;
        } catch (error) {
          attempts.push(`${parser.siteKey}: ${String(error)}`);
        }
      }

      throw new Error(`章节解析失败。${attempts.join(' | ')}`);
    })();

    this.inFlightLoads.set(key, job);
    try {
      return await job;
    } finally {
      this.inFlightLoads.delete(key);
    }
  }

  async preloadChapterContent(bookId: string, chapterId: string): Promise<void> {
    try {
      await this.loadChapterContent(bookId, chapterId);
    } catch {
      // Ignore prefetch failures; foreground reading path will retry on demand.
    }
  }
}

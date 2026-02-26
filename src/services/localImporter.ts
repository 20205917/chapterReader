import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CacheService } from './cacheService';
import { Store } from '../storage/store';
import { Book, Chapter } from '../types';
import { parseTxtChapters } from './txtParser';
import { parseEpub } from './epubParser';

export class LocalImporter {
  constructor(private readonly store: Store, private readonly cache: CacheService) {}

  async importFile(filePath: string): Promise<Book> {
    const ext = path.extname(filePath).toLowerCase();
    const now = Date.now();
    const bookId = crypto.createHash('sha1').update(`local:${filePath}`).digest('hex').slice(0, 16);
    let bookTitle = path.basename(filePath, ext);
    let chapterContent: Array<{ id: string; title: string; content: string; index: number }> = [];

    if (ext === '.txt') {
      const raw = await fs.readFile(filePath, 'utf8');
      chapterContent = parseTxtChapters(raw);
    } else if (ext === '.epub') {
      const parsed = parseEpub(filePath);
      bookTitle = parsed.title;
      chapterContent = parsed.chapters;
    } else {
      throw new Error(`Unsupported local format: ${ext}`);
    }

    const chapters: Chapter[] = chapterContent.map((c) => ({
      id: c.id,
      bookId,
      title: c.title,
      index: c.index,
      sourceRef: filePath,
      wordCount: c.content.length
    }));

    for (const chapter of chapterContent) {
      await this.cache.set(bookId, chapter.id, chapter.content);
    }

    const book: Book = {
      id: bookId,
      title: bookTitle,
      sourceType: 'local',
      localPath: filePath,
      createdAt: now,
      updatedAt: now,
      chapterCount: chapters.length
    };

    this.store.upsertBook(book);
    this.store.setBookChapters(bookId, chapters);
    await this.store.save();
    return book;
  }
}

import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Store } from '../storage/store';

export class CacheService {
  private readonly cacheDir: string;

  constructor(
    storagePath: string,
    private readonly store: Store,
    private readonly maxCacheMB = 12
  ) {
    this.cacheDir = path.join(storagePath, 'cache');
  }

  async init(): Promise<void> {
    await fs.mkdir(this.cacheDir, { recursive: true });
  }

  private makeKey(bookId: string, chapterId: string): string {
    return `${bookId}:${chapterId}`;
  }

  private resolvePath(key: string): string {
    return path.join(this.cacheDir, crypto.createHash('sha1').update(key).digest('hex') + '.txt');
  }

  async get(bookId: string, chapterId: string): Promise<string | undefined> {
    const key = this.makeKey(bookId, chapterId);
    try {
      const file = this.resolvePath(key);
      const content = await fs.readFile(file, 'utf8');
      const entries = this.store.listCacheEntries();
      const hit = entries.find((e) => e.key === key);
      if (hit) {
        this.store.upsertCacheEntry({ ...hit, updatedAt: Date.now() });
        await this.store.save();
      }
      return content;
    } catch {
      return undefined;
    }
  }

  async set(bookId: string, chapterId: string, content: string): Promise<void> {
    const key = this.makeKey(bookId, chapterId);
    const file = this.resolvePath(key);
    await fs.writeFile(file, content, 'utf8');
    this.store.upsertCacheEntry({
      key,
      bookId,
      chapterId,
      size: Buffer.byteLength(content, 'utf8'),
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    await this.enforceLimit(this.maxCacheMB);
    await this.store.save();
  }

  async clearAll(): Promise<void> {
    await fs.rm(this.cacheDir, { recursive: true, force: true });
    await fs.mkdir(this.cacheDir, { recursive: true });
    this.store.clearCacheEntries();
    await this.store.save();
  }

  async clearBook(bookId: string): Promise<void> {
    const entries = this.store.listCacheEntries().filter((e) => e.bookId === bookId);
    for (const entry of entries) {
      await fs.rm(this.resolvePath(entry.key), { force: true });
      this.store.removeCacheEntry(entry.key);
    }
    await this.store.save();
  }

  async enforceLimit(maxMB: number): Promise<void> {
    const maxBytes = maxMB * 1024 * 1024;
    const entries = this.store.listCacheEntries();
    const total = entries.reduce((sum, e) => sum + e.size, 0);
    if (total <= maxBytes) {
      return;
    }

    let used = total;
    for (const entry of entries) {
      if (used <= maxBytes) {
        break;
      }
      await fs.rm(this.resolvePath(entry.key), { force: true });
      this.store.removeCacheEntry(entry.key);
      used -= entry.size;
    }
    await this.store.save();
  }

  getStats(): { entries: number; bytes: number } {
    const entries = this.store.listCacheEntries();
    return {
      entries: entries.length,
      bytes: entries.reduce((sum, e) => sum + e.size, 0)
    };
  }
}

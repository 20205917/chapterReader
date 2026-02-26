import * as crypto from 'crypto';
import * as path from 'path';
import * as vscode from 'vscode';
import { CacheService } from './services/cacheService';
import { ReaderService } from './services/readerService';
import { Store } from './storage/store';
import { renderWebviewHtml } from './webview/html';

class ReaderViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'chapterReader.mainView';

  private view?: vscode.WebviewView;
  private currentBookId?: string;
  private currentChapterId?: string;
  private readonly progressSaveTimers = new Map<string, NodeJS.Timeout>();
  private readonly pendingProgress = new Map<string, { chapterId: string; offset: number }>();
  private readonly progressDebounceMs = 280;

  constructor(private readonly reader: ReaderService) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = renderWebviewHtml(crypto.randomBytes(16).toString('hex'));

    webviewView.webview.onDidReceiveMessage(async (msg) => {
      try {
        await this.handleMessage(msg);
      } catch (error) {
        this.post('error', { message: String(error) });
      }
    });
  }

  async open(): Promise<void> {
    await vscode.commands.executeCommand('workbench.view.extension.chapterReader');
    this.postSnapshot();
  }

  async importLocal(): Promise<void> {
    const pick = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      filters: {
        Books: ['txt', 'epub']
      }
    });
    if (!pick || pick.length === 0) {
      return;
    }

    const book = await this.reader.localImporter.importFile(pick[0].fsPath);
    this.post('status', { message: `已导入: ${book.title}` });
    this.postSnapshot();
    await this.openBook(book.id);
  }

  async addOnline(): Promise<void> {
    const url = await vscode.window.showInputBox({
      prompt: '输入小说目录页 URL',
      placeHolder: 'https://example.com/book/123/'
    });
    if (!url) {
      return;
    }

    const book = await this.reader.onlineService.addBookByUrl(url.trim());
    this.post('status', { message: `已添加在线书籍: ${book.title}` });
    this.postSnapshot();
    await this.openBook(book.id);
  }

  async nextChapter(): Promise<void> {
    await this.jumpChapter(1);
  }

  async prevChapter(): Promise<void> {
    await this.jumpChapter(-1);
  }

  async toggleShelf(): Promise<void> {
    this.post('toggleShelf');
  }

  async toggleCatalog(): Promise<void> {
    this.post('toggleCatalog');
  }

  async toggleStealth(): Promise<void> {
    this.post('toggleStealth');
  }

  private queueProgressSave(bookId: string, chapterId: string, offset: number): void {
    this.pendingProgress.set(bookId, { chapterId, offset });
    const prevTimer = this.progressSaveTimers.get(bookId);
    if (prevTimer) {
      clearTimeout(prevTimer);
    }
    const timer = setTimeout(() => {
      void this.flushProgressSave(bookId);
    }, this.progressDebounceMs);
    this.progressSaveTimers.set(bookId, timer);
  }

  private async flushProgressSave(bookId: string): Promise<void> {
    const pending = this.pendingProgress.get(bookId);
    if (!pending) {
      return;
    }
    this.pendingProgress.delete(bookId);
    this.progressSaveTimers.delete(bookId);
    await this.reader.setProgress(bookId, pending.chapterId, pending.offset);
  }

  private async jumpChapter(delta: number): Promise<void> {
    if (!this.currentBookId || !this.currentChapterId) {
      return;
    }
    const chapters = this.reader.getChapters(this.currentBookId);
    const idx = chapters.findIndex((c) => c.id === this.currentChapterId);
    if (idx < 0) {
      return;
    }
    const target = chapters[idx + delta];
    if (!target) {
      this.post('status', { message: delta > 0 ? '已经是最后一章' : '已经是第一章' });
      return;
    }
    await this.openChapter(this.currentBookId, target.id, 0);
  }

  private async handleMessage(msg: any): Promise<void> {
    switch (msg.type) {
      case 'init':
        this.postSnapshot();
        break;
      case 'importLocal':
        await this.importLocal();
        break;
      case 'addOnline':
        await this.addOnline();
        break;
      case 'openBook':
        await this.openBook(msg.bookId);
        break;
      case 'openChapter':
        await this.openChapter(msg.bookId, msg.chapterId, msg.offset || 0);
        break;
      case 'nextChapter':
        await this.nextChapter();
        break;
      case 'prevChapter':
        await this.prevChapter();
        break;
      case 'saveProgress':
        this.queueProgressSave(msg.bookId, msg.chapterId, msg.offset || 0);
        break;
      case 'saveSettings':
        await this.reader.setSettings(msg.settings);
        this.postSnapshot();
        this.post('status', { message: '设置已保存' });
        break;
      case 'deleteBook':
        await this.deleteBook(msg.bookId);
        break;
      default:
        break;
    }
  }

  private async deleteBook(bookId: string): Promise<void> {
    const book = this.reader.getSnapshot().books.find((b) => b.id === bookId);
    if (!book) {
      return;
    }
    const confirm = await vscode.window.showWarningMessage(
      `确认删除《${book.title}》吗？`,
      { modal: true },
      '删除'
    );
    if (confirm !== '删除') {
      return;
    }
    await this.reader.deleteBook(bookId);
    let removedCurrent = false;
    if (this.currentBookId === bookId) {
      this.currentBookId = undefined;
      this.currentChapterId = undefined;
      removedCurrent = true;
    }
    this.post('status', { message: `已删除: ${book.title}` });
    this.postSnapshot();
    if (removedCurrent) {
      this.post('bookCleared');
    }
  }

  private async openBook(bookId: string): Promise<void> {
    const snapshot = this.reader.getSnapshot();
    const book = snapshot.books.find((b) => b.id === bookId);
    if (!book) {
      throw new Error('书籍不存在');
    }
    const chapters = this.reader.getChapters(bookId);
    this.currentBookId = bookId;

    const progress = this.reader.getProgress(bookId);
    this.post('bookOpened', {
      book,
      chapters,
      progress
    });

    if (!progress && chapters[0]) {
      await this.openChapter(bookId, chapters[0].id, 0);
    }
  }

  private async openChapter(bookId: string, chapterId: string, offset = 0): Promise<void> {
    const chapter = this.reader.getChapters(bookId).find((c) => c.id === chapterId);
    let content = await this.reader.getChapterContent(bookId, chapterId);
    if (chapter) {
      const lines = content.split('\n');
      if (lines[0]?.trim() === chapter.title.trim()) {
        lines.shift();
      }
      content = lines.join('\n').trim();
    }
    this.currentBookId = bookId;
    this.currentChapterId = chapterId;
    this.post('chapterOpened', {
      bookId,
      chapterId,
      content,
      offset
    });
    this.queueProgressSave(bookId, chapterId, offset);
    void this.reader.preloadAdjacentChapters(bookId, chapterId, { ahead: 2, behind: 1 });
  }

  private postSnapshot(): void {
    this.post('snapshot', this.reader.getSnapshot());
  }

  private post(type: string, payload?: unknown): void {
    this.view?.webview.postMessage({ type, payload });
  }
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const storagePath = context.globalStorageUri.fsPath || path.join(context.extensionPath, '.storage');
  const store = new Store(storagePath);
  await store.init();
  const cache = new CacheService(storagePath, store);
  await cache.init();
  const reader = new ReaderService(store, cache);
  const provider = new ReaderViewProvider(reader);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ReaderViewProvider.viewType, provider),
    vscode.commands.registerCommand('chapterReader.open', () => provider.open()),
    vscode.commands.registerCommand('chapterReader.importLocalBook', () => provider.importLocal()),
    vscode.commands.registerCommand('chapterReader.addOnlineBook', () => provider.addOnline()),
    vscode.commands.registerCommand('chapterReader.nextChapter', () => provider.nextChapter()),
    vscode.commands.registerCommand('chapterReader.prevChapter', () => provider.prevChapter()),
    vscode.commands.registerCommand('chapterReader.toggleShelf', () => provider.toggleShelf()),
    vscode.commands.registerCommand('chapterReader.toggleCatalog', () => provider.toggleCatalog()),
    vscode.commands.registerCommand('chapterReader.toggleStealth', () => provider.toggleStealth())
  );
}

export function deactivate(): void {}

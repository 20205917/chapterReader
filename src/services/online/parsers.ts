import * as cheerio from 'cheerio';
import { ParserResult } from '../../types';
import { fetchHtml } from './fetchHtml';

export interface SiteParser {
  siteKey: string;
  canHandle(url: string): boolean;
  parseBook(url: string): Promise<ParserResult>;
  parseChapter(chapterUrl: string): Promise<string>;
}

function normalizeChapterText(raw: string): string {
  const blockedLine =
    /^(?:textselect\(\);?|(?:read_\d+_\d+\(\);?\s*)+|[a-z_][a-z0-9_]*\(\);?|最新网址|手机用户请浏览|加入书签|返回目录|推荐阅读|广告)$/i;
  const navLine = /(上一章.*章节目录.*下一章|下一章.*章节目录.*上一章)/;
  const breadcrumbLine = /^.{1,40}\s*[>＞]\s*.{1,40}\s*[>＞]\s*.{1,80}$/;
  const menuLine = /^(首页|玄幻小说|修真小说|都市小说|穿越小说|网游小说|科幻小说|其他小说|排行榜单|完本小说|全部小说)$/;
  const lines = raw
    .replace(/textselect\(\);?/gi, '\n')
    .replace(/read_\d+_\d+\(\);?/gi, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .split('\n')
    .map((line) => line.trim());

  const cleaned: string[] = [];
  let recommendSkipBudget = 0;

  for (const line of lines) {
    if (!line) {
      continue;
    }

    if (/^(热门推荐|猜你喜欢|相关推荐)[:：]?/.test(line)) {
      recommendSkipBudget = 12;
      continue;
    }
    if (recommendSkipBudget > 0) {
      recommendSkipBudget -= 1;
      continue;
    }

    if (blockedLine.test(line)) {
      continue;
    }
    if (menuLine.test(line)) {
      continue;
    }
    if (/^\S{1,6}小说$/.test(line)) {
      continue;
    }
    if (navLine.test(line)) {
      continue;
    }
    if (breadcrumbLine.test(line)) {
      continue;
    }
    if (line.length <= 1) {
      continue;
    }
    if (/^(第.{1,20}(章|回|节).*)$/.test(line) && line.length > 22) {
      continue;
    }
    cleaned.push(line);
  }

  // Remove duplicated consecutive lines caused by some ad-injected templates.
  const deduped: string[] = [];
  for (const line of cleaned) {
    if (deduped[deduped.length - 1] === line) {
      continue;
    }
    deduped.push(line);
  }
  return deduped.join('\n').trim();
}

function scoreChapter(url: string): number {
  const nums = url.match(/\d+/g);
  if (!nums || nums.length === 0) {
    return Number.MAX_SAFE_INTEGER;
  }
  const tail = nums.slice(-2).join('');
  const parsed = Number(tail);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function chapterIndexFromTitle(title: string): number | undefined {
  const m = title.match(/第\s*([0-9]{1,6})\s*(章|回|节)/i);
  if (!m) {
    return undefined;
  }
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : undefined;
}

function finalizeChapters(chapters: Array<{ title: string; url: string }>): Array<{ title: string; url: string }> {
  const cleaned = chapters.filter(
    (c) => !/(上一章|下一章|返回|目录|首页|加入书签|推荐阅读|章节报错)/.test(c.title)
  );
  if (cleaned.length <= 1) {
    return cleaned;
  }

  const withIndex = cleaned.map((c, i) => ({
    ...c,
    _i: i,
    idx: chapterIndexFromTitle(c.title) ?? scoreChapter(c.url)
  }));
  const finite = withIndex.filter((c) => Number.isFinite(c.idx) && c.idx < Number.MAX_SAFE_INTEGER).length;
  if (finite < Math.max(3, Math.floor(withIndex.length * 0.55))) {
    return cleaned;
  }

  withIndex.sort((a, b) => {
    if (a.idx !== b.idx) {
      return a.idx - b.idx;
    }
    return a._i - b._i;
  });
  return withIndex.map(({ _i, idx, ...rest }) => rest);
}

function chapterTextScore(text: string): number {
  let score = text.length;
  const sentenceCount = (text.match(/[。！？…]/g) || []).length;
  score += Math.min(sentenceCount * 12, 600);
  const badCount =
    (text.match(/(?:字体|颜色|大小|行距|阅读设置|上一章|下一章|章节目录|加入书签|返回目录|返回书页|推荐|登录|注册|搜索)/g) || [])
      .length;
  score -= badCount * 80;
  if (/read_\d+_\d+\(\);|textselect\(\);/i.test(text)) {
    score -= 300;
  }
  return score;
}

function pickBestContentText($: cheerio.CheerioAPI, selectors: string): string {
  const candidates: Array<{ text: string; score: number }> = [];
  const seen = new Set<string>();
  $(selectors).each((_i, el) => {
    const cleaned = normalizeChapterText($(el).text());
    if (!cleaned || cleaned.length < 40) {
      return;
    }
    const idClass = `${$(el).attr('id') || ''} ${$(el).attr('class') || ''}`.toLowerCase();
    const tag = ((el as any).tagName || '').toLowerCase();
    const key = cleaned.slice(0, 120);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    let score = chapterTextScore(cleaned);
    if (/\b(content|chaptercontent|booktext)\b/.test(idClass)) {
      score += 900;
    }
    if (/(article-content|read-content|article|txt)/.test(idClass)) {
      score += 450;
    }
    if (/(nav|menu|header|footer|toolbar|tool|setting)/.test(idClass)) {
      score -= 1200;
    }
    if (tag === 'body') {
      score -= 1800;
    }
    candidates.push({ text: cleaned, score });
  });

  if (candidates.length === 0) {
    return '';
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].text;
}

class BiqugeLikeParser implements SiteParser {
  constructor(
    public readonly siteKey: string,
    private readonly hostKeywords: string[],
    private readonly selectors: {
      title: string;
      author: string;
      chapterLinks: string;
      content: string;
    }
  ) {}

  canHandle(url: string): boolean {
    try {
      const host = new URL(url).host.toLowerCase();
      return this.hostKeywords.some((k) => host.includes(k));
    } catch {
      return false;
    }
  }

  async parseBook(url: string): Promise<ParserResult> {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const title = $(this.selectors.title).first().text().trim() || $('title').text().trim() || '未命名小说';
    const author = $(this.selectors.author).first().text().replace(/^作者[:：]?\s*/, '').trim() || undefined;

    const seen = new Set<string>();
    const chapters: Array<{ title: string; url: string }> = [];
    $(this.selectors.chapterLinks).each((_i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (!href || !text) {
        return;
      }
      const abs = new URL(href, url).toString();
      if (seen.has(abs)) {
        return;
      }
      seen.add(abs);
      chapters.push({ title: text, url: abs });
    });

    if (chapters.length === 0) {
      // Fallback: extract chapter-like links from the whole page.
      $('a[href]').each((_i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        if (!href || !text || text.length > 80) {
          return;
        }
        const abs = new URL(href, url).toString();
        const path = new URL(abs).pathname.toLowerCase();
        const chapterLike =
          /\/book\/\d+\/\d+\.html$/.test(path) ||
          /\/\d+_\d+\/\d+\.html$/.test(path) ||
          /\/chapter\/\d+/.test(path);
        const titleLike = /第.{1,12}(章|回|节)|chapter\s*\d+/i.test(text);
        if (!chapterLike && !titleLike) {
          return;
        }
        if (seen.has(abs)) {
          return;
        }
        seen.add(abs);
        chapters.push({ title: text, url: abs });
      });
    }

    const finalChapters = finalizeChapters(chapters);

    if (finalChapters.length === 0) {
      throw new Error('No chapters found');
    }

    return {
      bookMeta: { title, author },
      chapters: finalChapters
    };
  }

  async parseChapter(chapterUrl: string): Promise<string> {
    const html = await fetchHtml(chapterUrl);
    const $ = cheerio.load(html);
    const text = pickBestContentText($, this.selectors.content);

    if (!text) {
      throw new Error('No chapter content found');
    }
    return text;
  }
}

class GenericParser implements SiteParser {
  readonly siteKey = 'generic';

  canHandle(_url: string): boolean {
    return true;
  }

  async parseBook(url: string): Promise<ParserResult> {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const source = new URL(url);
    const sourceBookId = source.pathname.match(/^\/book\/(\d+)\/?$/)?.[1] || source.pathname.match(/^\/(\d+)\/?$/)?.[1];
    const sourceIsFlatBookPath = /^\/(\d+)\/?$/.test(source.pathname);
    const sourcePrefix = source.pathname.endsWith('/')
      ? source.pathname
      : source.pathname.replace(/\/[^/]*$/, '/');
    const title =
      $('meta[property="og:novel:book_name"]').attr('content')?.trim() ||
      $('meta[property="og:title"]').attr('content')?.trim() ||
      $('h1').first().text().trim() ||
      $('title').first().text().trim() ||
      '未命名小说';

    const author =
      $('meta[property="og:novel:author"]').attr('content')?.trim() ||
      $('[class*=author], [id*=author]').first().text().replace(/^作者[:：]?\s*/, '').trim() ||
      undefined;

    const seen = new Set<string>();
    const chapters: Array<{ title: string; url: string }> = [];
    const chapterTitleLike = /第.{1,18}(章|回|节)|chapter\s*\d+|ep(isode)?\s*\d+/i;
    const badTitleLike = /(首页|分类|玄幻|武侠|都市|历史|科幻|网游|排行|全本|作者|书架|登录|注册|搜索|上一章|下一章|章节报错)/;
    const badPathLike = /(\/fenlei\/|\/sort\/|\/top\/|\/rank\/|\/paihang\/|\/author\/|\/search\/|\/login|\/register|\/tags\/)/i;

    $('a[href]').each((_i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (!href || !text || text.length > 80) {
        return;
      }
      const abs = new URL(href, url).toString();
      const parsed = new URL(abs);
      const path = parsed.pathname.toLowerCase();
      if (parsed.host !== source.host) {
        return;
      }

      let score = 0;
      if (sourceBookId) {
        const sameBookChapter = sourceIsFlatBookPath
          ? new RegExp(`^/${sourceBookId}/\\d+\\.html$`)
          : new RegExp(`^/book/${sourceBookId}/\\d+\\.html$`);
        if (sameBookChapter.test(path)) {
          score += 8;
        }
      }

      const chapterLikePath =
        /\/book\/\d+\/\d+\.html$/.test(path) ||
        /\/\d+_\d+\/\d+\.html$/.test(path) ||
        /\/chapter\/\d+/.test(path) ||
        /\/\d+\/\d+\.html$/.test(path) ||
        /\/\d+\/\d+\/?$/.test(path);
      if (chapterLikePath) {
        score += 4;
      }
      if (chapterTitleLike.test(text)) {
        score += 5;
      }
      if (sourcePrefix !== '/' && parsed.pathname.startsWith(sourcePrefix)) {
        score += 2;
      }
      if (badTitleLike.test(text)) {
        score -= 6;
      }
      if (badPathLike.test(path)) {
        score -= 6;
      }

      const ctx = [
        $(el).closest('[id],[class]').attr('id') || '',
        $(el).closest('[id],[class]').attr('class') || '',
        $(el).parent().attr('id') || '',
        $(el).parent().attr('class') || ''
      ].join(' ').toLowerCase();
      if (/(list|catalog|chapter|dir|ml|toc|zhangjie|booklist)/.test(ctx)) {
        score += 2;
      }

      if (score < 5) {
        return;
      }
      if (seen.has(abs)) {
        return;
      }
      seen.add(abs);
      chapters.push({ title: text, url: abs });
    });

    const finalChapters = finalizeChapters(chapters);
    if (finalChapters.length === 0) {
      throw new Error('No chapters found');
    }

    return {
      bookMeta: { title, author },
      chapters: finalChapters
    };
  }

  async parseChapter(chapterUrl: string): Promise<string> {
    const html = await fetchHtml(chapterUrl);
    const $ = cheerio.load(html);
    const text = pickBestContentText(
      $,
      '#content, #chaptercontent, .txt, .article-content, .read-content, .content, .article, article, [id*=content], [class*=content], body'
    );

    if (!text) {
      throw new Error('No chapter content found');
    }
    return text;
  }
}

export function defaultParsers(): SiteParser[] {
  return [
    new BiqugeLikeParser('biquge', ['biquge', 'biqige', 'bqg'], {
      title: '#info h1, .bookname h1, h1',
      author: '#info p, .bookname p',
      chapterLinks: '#list dd a, #list a, .listmain dd a, .listmain a, .chapterlist a, .cover ul li a',
      content: '#content, .content, #chaptercontent, .txt, article'
    }),
    new BiqugeLikeParser('ixdzs', ['ixdzs.com', 'ixdzs8'], {
      title: '.book-nav h1, h1',
      author: '.book-inf .author, .author',
      chapterLinks: '.chapter li a, .catalog li a',
      content: '.content, #content, article'
    }),
    new GenericParser()
  ];
}

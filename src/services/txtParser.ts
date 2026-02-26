import * as crypto from 'crypto';

interface ParsedChapter {
  id: string;
  title: string;
  content: string;
  index: number;
}

const CHAPTER_PATTERNS = [
  /^第[\d一二三四五六七八九十百千万两零〇]+[章回卷节部篇].*$/,
  /^(Chapter|CHAPTER)\s+\d+.*$/
];

function isChapterTitle(line: string): boolean {
  const text = line.trim();
  if (!text || text.length > 60) {
    return false;
  }
  return CHAPTER_PATTERNS.some((p) => p.test(text));
}

export function parseTxtChapters(text: string): ParsedChapter[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const chapters: ParsedChapter[] = [];
  let matchedChapterTitle = false;

  let currentTitle = '开始';
  let current: string[] = [];

  const flush = () => {
    const content = current.join('\n').trim();
    if (!content) {
      return;
    }
    const id = crypto.createHash('sha1').update(`${currentTitle}-${chapters.length}`).digest('hex').slice(0, 16);
    chapters.push({
      id,
      title: currentTitle,
      content,
      index: chapters.length
    });
  };

  for (const line of lines) {
    if (isChapterTitle(line)) {
      matchedChapterTitle = true;
      flush();
      currentTitle = line.trim();
      current = [];
      continue;
    }
    current.push(line);
  }
  flush();

  if (matchedChapterTitle && chapters.length > 0) {
    return chapters;
  }

  const chunkSize = 4000;
  const raw = text.replace(/\s+/g, ' ').trim();
  const fallback: ParsedChapter[] = [];
  for (let i = 0; i < raw.length; i += chunkSize) {
    const content = raw.slice(i, i + chunkSize);
    const index = fallback.length;
    fallback.push({
      id: crypto.createHash('sha1').update(`fallback-${index}`).digest('hex').slice(0, 16),
      title: `第 ${index + 1} 节`,
      content,
      index
    });
  }
  return fallback;
}

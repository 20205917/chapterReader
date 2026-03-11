import * as crypto from 'crypto';

interface ParsedChapter {
  id: string;
  title: string;
  content: string;
  index: number;
}

const CHAPTER_PATTERNS = [
  /^第[\d一二三四五六七八九十百千万两零〇]+[章回卷节部篇].*$/,
  /^(Chapter|CHAPTER)\s+\d+.*$/,
  /^(序章|楔子|引子|前言|后记|尾声|番外|番外篇|终章)\s*.*$/
];

function isChapterTitle(line: string): boolean {
  const text = line.trim();
  if (!text || text.length > 72) {
    return false;
  }
  if (!/[A-Za-z\u4e00-\u9fff]/.test(text)) {
    return false;
  }
  return CHAPTER_PATTERNS.some((p) => p.test(text));
}

function normalizeText(raw: string): string {
  return raw
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u3000/g, '  ')
    .replace(/\t/g, '    ')
    .replace(/[ \t]+\n/g, '\n');
}

function splitLongTextByPunctuation(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  let cursor = text.trim();
  while (cursor.length > chunkSize) {
    const window = cursor.slice(0, chunkSize + 240);
    const candidates = [...window.matchAll(/[。！？；!?;]\s*/g)];
    const near = candidates
      .map((m) => (m.index ?? 0) + m[0].length)
      .filter((idx) => idx > Math.floor(chunkSize * 0.55) && idx <= chunkSize + 220);
    const cutAt = near.length > 0 ? near[near.length - 1] : chunkSize;
    chunks.push(cursor.slice(0, cutAt).trim());
    cursor = cursor.slice(cutAt).trim();
  }
  if (cursor) {
    chunks.push(cursor);
  }
  return chunks.filter(Boolean);
}

function chunkFallbackContent(text: string, chunkSize: number): string[] {
  const normalized = text.replace(/\n{3,}/g, '\n\n').trim();
  if (!normalized) {
    return [];
  }
  const paragraphs = normalized.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) {
    return splitLongTextByPunctuation(normalized, chunkSize);
  }

  const chunks: string[] = [];
  let buffer = '';
  const flush = () => {
    const content = buffer.trim();
    if (content) {
      chunks.push(content);
    }
    buffer = '';
  };

  for (const paragraph of paragraphs) {
    const piece = paragraph.length > chunkSize ? splitLongTextByPunctuation(paragraph, chunkSize) : [paragraph];
    for (const part of piece) {
      if (!buffer) {
        buffer = part;
        continue;
      }
      const next = `${buffer}\n\n${part}`;
      if (next.length <= chunkSize) {
        buffer = next;
      } else {
        flush();
        buffer = part;
      }
    }
  }
  flush();
  return chunks;
}

export function parseTxtChapters(text: string): ParsedChapter[] {
  const normalizedText = normalizeText(text);
  const lines = normalizedText.split('\n');
  const chapters: ParsedChapter[] = [];
  let matchedChapterTitle = false;

  let currentTitle = '开始';
  let current: string[] = [];

  const flush = () => {
    const content = current.join('\n').replace(/\n{3,}/g, '\n\n').trim();
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
    const candidate = line.trim();
    if (isChapterTitle(candidate)) {
      matchedChapterTitle = true;
      flush();
      currentTitle = candidate;
      current = [];
      continue;
    }
    current.push(line.trimEnd());
  }
  flush();

  if (matchedChapterTitle && chapters.length > 0) {
    return chapters;
  }

  const chunkSize = 4200;
  const fallbackChunks = chunkFallbackContent(normalizedText, chunkSize);
  const fallback: ParsedChapter[] = [];
  for (const content of fallbackChunks) {
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

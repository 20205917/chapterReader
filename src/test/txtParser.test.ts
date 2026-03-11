import { strict as assert } from 'assert';
import { parseTxtChapters } from '../services/txtParser';

describe('txtParser', () => {
  it('should split by chapter titles', () => {
    const text = '第1章 开始\n内容A\n第2章 继续\n内容B';
    const chapters = parseTxtChapters(text);
    assert.equal(chapters.length, 2);
    assert.equal(chapters[0].title, '第1章 开始');
    assert.equal(chapters[1].title, '第2章 继续');
  });

  it('should fallback for text without chapter marks', () => {
    const text = 'a'.repeat(9000);
    const chapters = parseTxtChapters(text);
    assert.ok(chapters.length >= 2);
  });

  it('should recognize special chapter headers', () => {
    const text = '序章\n开场内容\n第1章 正文\n正文内容';
    const chapters = parseTxtChapters(text);
    assert.equal(chapters.length, 2);
    assert.equal(chapters[0].title, '序章');
    assert.equal(chapters[1].title, '第1章 正文');
  });

  it('should keep paragraph breaks in fallback chunks', () => {
    const text = Array.from({ length: 240 }, (_, i) => `段落 ${i + 1}：` + '内容'.repeat(26)).join('\n\n');
    const chapters = parseTxtChapters(text);
    assert.ok(chapters.length > 1);
    assert.ok(chapters[0].content.includes('\n\n'));
  });
});

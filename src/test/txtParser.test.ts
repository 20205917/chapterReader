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
});

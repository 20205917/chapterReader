import { strict as assert } from 'assert';
import * as cheerio from 'cheerio';
import { __testOnly, defaultParsers } from '../services/online/parsers';

describe('online parser chain', () => {
  it('should keep site specific parser for known hosts', () => {
    const parsers = defaultParsers();
    const biquge = parsers.find((p) => p.siteKey === 'biquge');
    const ok = Boolean(biquge?.canHandle('https://www.biquge.com/book/1/'));
    assert.equal(ok, true);
  });

  it('should route dynxsw to generic parser by default', () => {
    const parsers = defaultParsers();
    const biquge = parsers.find((p) => p.siteKey === 'biquge');
    const generic = parsers.find((p) => p.siteKey === 'generic');
    assert.equal(Boolean(biquge?.canHandle('https://www.dynxsw.com/book/522147/')), false);
    assert.equal(Boolean(generic?.canHandle('https://www.dynxsw.com/book/522147/')), true);
  });

  it('should route xkanshujun to generic parser by default', () => {
    const parsers = defaultParsers();
    const biquge = parsers.find((p) => p.siteKey === 'biquge');
    const generic = parsers.find((p) => p.siteKey === 'generic');
    assert.equal(Boolean(biquge?.canHandle('https://www.xkanshujun.com/95105055/')), false);
    assert.equal(Boolean(generic?.canHandle('https://www.xkanshujun.com/95105055/')), true);
  });

  it('should allow unknown hosts via generic parser', () => {
    const parsers = defaultParsers();
    const generic = parsers.find((p) => p.siteKey === 'generic');
    const ok = Boolean(generic?.canHandle('https://example.org/novel/1'));
    assert.equal(ok, true);
  });

  it('should keep chapter line breaks for br-separated content', () => {
    const $ = cheerio.load(`
      <div id="txt" class="txt">
        <p>一秒记住【顶点小说】dingdian100.com，更新快，无弹窗！</p><br>
        &nbsp;&nbsp;&nbsp;&nbsp;第一段。<br/>&nbsp;&nbsp;&nbsp;&nbsp;第二段。<br/>第三段。
      </div>
    `);
    const raw = __testOnly.extractTextWithLineBreaks($('#txt').get(0));
    const normalized = __testOnly.normalizeChapterText(raw);
    assert.equal(normalized, '第一段。\n第二段。\n第三段。');
  });

  it('should keep paragraph boundaries for p tags', () => {
    const $ = cheerio.load('<div class="content"><p>甲段</p><p>乙段</p><p>丙段</p></div>');
    const raw = __testOnly.extractTextWithLineBreaks($('.content').get(0));
    const normalized = __testOnly.normalizeChapterText(raw);
    assert.equal(normalized, '甲段\n乙段\n丙段');
  });
});

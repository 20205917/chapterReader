import { strict as assert } from 'assert';
import { defaultParsers } from '../services/online/parsers';

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
});

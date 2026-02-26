import * as crypto from 'crypto';
import * as path from 'path';
import AdmZip from 'adm-zip';
import * as cheerio from 'cheerio';

interface EpubChapter {
  id: string;
  title: string;
  content: string;
  index: number;
}

function readText(zip: AdmZip, entryName: string): string {
  const entry = zip.getEntry(entryName);
  if (!entry) {
    throw new Error(`Missing EPUB entry: ${entryName}`);
  }
  return entry.getData().toString('utf8');
}

function cleanHtmlText(html: string): string {
  const $ = cheerio.load(html);
  $('script,style').remove();
  return $('body').text().replace(/\n{3,}/g, '\n\n').trim();
}

export function parseEpub(filePath: string): { title: string; chapters: EpubChapter[] } {
  const zip = new AdmZip(filePath);
  const containerXml = readText(zip, 'META-INF/container.xml');
  const container$ = cheerio.load(containerXml, { xmlMode: true });
  const opfPath = container$('rootfile').attr('full-path');
  if (!opfPath) {
    throw new Error('Invalid EPUB: OPF path not found');
  }

  const opfXml = readText(zip, opfPath);
  const opf$ = cheerio.load(opfXml, { xmlMode: true });

  const title = opf$('metadata > title, dc\\:title').first().text().trim() || path.basename(filePath, path.extname(filePath));

  const manifest = new Map<string, string>();
  opf$('manifest item').each((_i, el) => {
    const id = opf$(el).attr('id');
    const href = opf$(el).attr('href');
    if (id && href) {
      manifest.set(id, href);
    }
  });

  const baseDir = path.posix.dirname(opfPath);
  const chapters: EpubChapter[] = [];

  opf$('spine itemref').each((index, el) => {
    const idref = opf$(el).attr('idref');
    if (!idref) {
      return;
    }
    const href = manifest.get(idref);
    if (!href) {
      return;
    }
    const entryPath = path.posix.normalize(path.posix.join(baseDir, href));
    try {
      const html = readText(zip, entryPath);
      const content = cleanHtmlText(html);
      if (!content) {
        return;
      }
      const $ = cheerio.load(html);
      const heading = $('h1,h2,title').first().text().trim();
      chapters.push({
        id: crypto.createHash('sha1').update(`epub-${index}-${entryPath}`).digest('hex').slice(0, 16),
        title: heading || `第 ${index + 1} 章`,
        content,
        index
      });
    } catch {
      // Skip malformed chapter files and continue.
    }
  });

  if (chapters.length === 0) {
    throw new Error('Invalid EPUB: no readable chapters found');
  }

  return { title, chapters };
}

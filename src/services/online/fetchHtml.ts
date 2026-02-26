import axios from 'axios';
import iconv from 'iconv-lite';

function detectCharset(headers: Record<string, unknown>, content: Buffer): string {
  const contentType = String(headers['content-type'] || '').toLowerCase();
  const byHeader = contentType.match(/charset=([^;]+)/i)?.[1];
  if (byHeader) {
    return byHeader.trim().toLowerCase();
  }
  const head = content.slice(0, 2000).toString('ascii').toLowerCase();
  const byMeta = head.match(/charset=['\"]?([a-z0-9-]+)/i)?.[1];
  return byMeta?.trim().toLowerCase() || 'utf-8';
}

export async function fetchHtml(url: string): Promise<string> {
  const response = await axios.get<ArrayBuffer>(url, {
    responseType: 'arraybuffer',
    timeout: 12000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (ChapterReader Extension)',
      Accept: 'text/html,application/xhtml+xml'
    }
  });

  const buffer = Buffer.from(response.data);
  const charset = detectCharset(response.headers, buffer);
  if (charset.includes('gbk') || charset.includes('gb2312') || charset.includes('gb18030')) {
    return iconv.decode(buffer, 'gb18030');
  }
  return buffer.toString('utf8');
}

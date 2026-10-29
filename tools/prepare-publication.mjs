// Set absolute sharing metadata once the final hosting URL is approved.
import { readFile, writeFile } from 'node:fs/promises';
const value = process.argv[2];
if (!value) throw new Error('Add meg a végleges HTTPS-címet.');
const url = new URL(value);
if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Tiszta, nyilvános HTTPS-cím szükséges.');
url.pathname = url.pathname.replace(/\/?$/, '/');
const index = new URL('../index.html', import.meta.url);
let html = await readFile(index, 'utf8');
const escape = text => text.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
html = html.replace(/<meta property="og:url"[^>]*>/g,'').replace(/<link rel="canonical"[^>]*>/g,'');
html = html.replace('<meta property="og:type" content="website">', `<meta property="og:type" content="website">\n  <meta property="og:url" content="${escape(url.href)}">\n  <link rel="canonical" href="${escape(url.href)}">`);
html = html.replace(/(<meta (?:property="og:image"|name="twitter:image") content=")[^"]*(">)/g, `$1${escape(new URL('assets/share.png',url).href)}$2`);
await writeFile(index,html);
console.log('A megosztási metaadatok frissítve.');

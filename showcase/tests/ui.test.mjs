import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const html = read('../index.html');
const app = read('../app.mjs');
const css = read('../style.css');
const gen = read('../generator.mjs');
const media = read('../media-utils.mjs');

test('showroom is correctly scoped to the FFmpeg project and npm distribution', () => {
  assert.match(html, /https:\/\/cecil-ia-labs\.github\.io\/ffmpeg-dev\//);
  assert.match(html, /www\.npmjs\.com\/package\/@cecilialabs\/ffmpeg/);
  assert.match(html, /github\.com\/cecil-ia-labs\/ffmpeg-dev/);
});
test('editing controls have actual DOM targets', () => {
  const required = new Set([...app.matchAll(/\$\('([^']+)'\)/g)].map(match => match[1]));
  for (const id of required) assert.ok(html.includes('id="' + id + '"'), 'Missing UI target: ' + id);
  assert.match(html, /id="media-input"[^>]*type="file"/);
  assert.match(html, /id="drop-input"[^>]*type="file"/);
});
test('media files stay in the browser and local object URLs are revoked', () => {
  assert.match(app, /URL\.createObjectURL\(file\)/);
  assert.match(app, /URL\.revokeObjectURL\(clip\.url\)/);
  assert.match(app, /probeDuration\(file,url,kind\)/);
  assert.match(app, /import\s*\{probeDuration\}\s*from\s*['"]\.\/media-utils\.mjs['"]/);
  assert.match(media, /element\.removeAttribute\('src'\)/);
  assert.match(media, /clearTimeout\(timer\)/);
  assert.match(html, /Nothing is transmitted to Cecil-IA Labs/);
  for(const moduleSource of [app, media]) assert.doesNotMatch(moduleSource, /\bfetch\s*\(|\bXMLHttpRequest\b|\bsendBeacon\s*\(/);
});
test('export modes rely on the central safe command generator', () => {
  const imports=app.match(/import\s*\{([^}]+)\}\s*from\s*['"]\.\/generator\.mjs['"]/);
  assert.ok(imports, 'App must import the central generator');
  const symbols=imports[1].split(',').map(s=>s.trim());
  for(const name of ['buildFFmpeg','buildPipeline','buildScript','pathForShell'])
    assert.ok(symbols.includes(name), 'Missing import from generator: '+name);
  assert.match(gen, /function normalize\(/);
  for (const mode of ['ffmpeg', 'bash', 'yaml']) assert.ok(html.includes('data-code="' + mode + '"'));
  assert.match(html, /browser previews your sources/i);
});
test('visual controls remain responsive and accessible', () => {
  assert.match(css, /@media\(max-width:750px\)/);
  assert.match(css, /\[hidden\]\{display:none!important\}/);
  assert.match(html, /aria-label="Output code format"/);
  assert.match(html, /aria-live="polite"/);
});

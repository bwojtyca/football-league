// Fails when a translation key written literally in the code is missing from a language file
// (evaluation 2 found the raw key "now.backShort" on every league page). Keys built at run time
// ('titles.' + id ...) are not checked; their prefixes must exist as objects.
// Run: node scripts/check-i18n.mjs (in CI, before the build).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const languages = ['pl', 'en'].map((lang) => ({
  lang,
  texts: JSON.parse(readFileSync(`public/i18n/${lang}.json`, 'utf8')),
}));

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return files(path);
    }
    return /\.(ts|html)$/.test(name) && !name.endsWith('.spec.ts') ? [path] : [];
  });
}

function lookup(texts, key) {
  return key
    .split('.')
    .reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), texts);
}

// 'a.b' | transloco, translate('a.b'), and a literal key followed by a dynamic part: 'a.b.' + x.
const literal =
  /'([a-zA-Z][\w]*(?:\.[\w]+)+)'\s*\|\s*transloco|translate\(\s*'([a-zA-Z][\w]*(?:\.[\w]+)+)'/g;
const prefix = /'([a-zA-Z][\w]*(?:\.[\w]+)*)\.'\s*\+/g;

const problems = [];
for (const file of files('src/app')) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(literal)) {
    const key = match[1] ?? match[2];
    for (const { lang, texts } of languages) {
      if (typeof lookup(texts, key) !== 'string') {
        problems.push(`${file}: "${key}" missing in ${lang}.json`);
      }
    }
  }
  for (const match of source.matchAll(prefix)) {
    for (const { lang, texts } of languages) {
      const node = lookup(texts, match[1]);
      if (!node || typeof node !== 'object') {
        problems.push(`${file}: "${match[1]}.*" missing in ${lang}.json`);
      }
    }
  }
}

if (problems.length) {
  console.error([...new Set(problems)].join('\n'));
  process.exit(1);
}
console.log('i18n: every literal key exists in pl.json and en.json');

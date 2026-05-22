const fs = require('fs');

const filePath = "src/app/admin/admins/page.tsx";

function getNamespace(filePath) {
  const parts = filePath.replace(/^src\//, '').replace(/\.tsx$/, '').split(/[\/]/);
  const isPage = parts[parts.length - 1] === 'page';
  if (isPage) parts.pop();
  const meaningful = parts.filter(p => p && !['app','components','admin','teacher','student','parent'].includes(p));
  let name = meaningful.length ? meaningful.map(p => p.replace(/[-_](.)/g, (_, c) => c.toUpperCase()).replace(/^(.)/, (_, c) => c.toLowerCase())).join('_') : 'misc';
  name = name.replace(/[^a-zA-Z0-9_]/g, '');
  if (/^\d/.test(name)) name = 'n' + name;
  if (!name) name = 'misc';
  return name;
}

function findBlockEnd(content, startIdx) {
  let i = startIdx;
  let braceCount = 0;
  let inString = false;
  let stringChar = null;
  let escaped = false;
  while (i < content.length) {
    const ch = content[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === stringChar) {
        inString = false;
        stringChar = null;
      }
    } else {
      if (ch === '"' || ch === "'" || ch === '`') {
        inString = true;
        stringChar = ch;
      } else if (ch === '{') {
        braceCount++;
      } else if (ch === '}') {
        braceCount--;
        if (braceCount === 0) {
          return i;
        }
      }
    }
    i++;
  }
  return -1;
}

const existingSections = new Set();
const translationsContent = fs.readFileSync('src/lib/i18n/translations.ts', 'utf8');
const sectionRe = /^\s+(\w+):\s*\{/gm;
let sm;
while ((sm = sectionRe.exec(translationsContent)) !== null) {
  existingSections.add(sm[1]);
}

let content = fs.readFileSync(filePath, 'utf8');

let nsBase = getNamespace(filePath);
let idx = 0;
let searchStart = 0;
let replaced = false;

while (true) {
  const tPos = content.indexOf('const T = {', searchStart);
  if (tPos === -1) break;

  const blockEnd = findBlockEnd(content, tPos + 'const T = '.length);
  if (blockEnd === -1) {
    console.error('Could not find end of T block in', filePath);
    break;
  }

  let afterBlock = blockEnd + 1;
  const asConst = content.slice(afterBlock, afterBlock + 20);
  if (asConst.trimStart().startsWith('as const')) {
    afterBlock = content.indexOf('const', afterBlock) + 'const'.length;
  }

  const tFuncRe = /\s*const\s+t\s*=\s*\(k:\s*keyof\s+typeof\s+T\)\s*=>\s*T\[k\]\[L\]\s*\?\?\s*T\[k\]\.fr/;
  const tFuncMatch = content.slice(afterBlock).match(tFuncRe);
  if (tFuncMatch) {
    afterBlock += tFuncMatch.index + tFuncMatch[0].length;
  }

  let ns = nsBase;
  const blockCount = (content.match(/const T = \{/g) || []).length;
  if (blockCount > 1) ns += `_${idx + 1}`;
  while (!existingSections.has(ns)) {
    ns += 'X';
  }

  const replacement = `  const t = useT("${ns}")`;
  content = content.slice(0, tPos) + replacement + content.slice(afterBlock);
  replaced = true;
  searchStart = tPos + replacement.length;
  idx++;
}

if (replaced) {
  if (content.includes('useLanguage')) {
    content = content.replace(
      /import\s+\{\s*useLanguage\s*\}\s+from\s+["']@\/contexts\/LanguageContext["']/,
      'import { useLanguage, useT } from "@/contexts/LanguageContext"'
    );
  } else {
    if (!content.includes('useT')) {
      content = `import { useT } from "@/contexts/LanguageContext"\n` + content;
    }
  }
  console.log(content);
}

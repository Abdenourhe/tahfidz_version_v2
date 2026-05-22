const fs = require('fs');
const content = fs.readFileSync('src/components/admin/parents.tsx', 'utf8');
const tPos = content.indexOf('const T = {');
let i = tPos + 'const T = '.length;
let braceCount = 0;
let inString = false;
let stringChar = null;
let escaped = false;
while (i < content.length) {
  const ch = content[i];
  if (inString) {
    if (escaped) { escaped = false; }
    else if (ch === '\\\\') { escaped = true; }
    else if (ch === stringChar) { inString = false; stringChar = null; }
  } else {
    if (ch === '"' || ch === "'" || ch === '`') { inString = true; stringChar = ch; }
    else if (ch === '{') { braceCount++; }
    else if (ch === '}') {
      braceCount--;
      if (braceCount === 0) {
        console.log('Found end at', i, 'char:', JSON.stringify(content.slice(i-10, i+10)));
        break;
      }
    }
  }
  i++;
}

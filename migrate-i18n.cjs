const fs = require('fs');
const path = require('path');

const files = [
  "src/components/admin/EvaluationsListClient.tsx",
  "src/components/admin/group-detail.tsx",
  "src/components/admin/parents.tsx",
  "src/components/admin/student-form.tsx",
  "src/components/admin/teachers.tsx",
  "src/components/student/StudentAttendanceClient.tsx",
  "src/components/student/StudentBadgesClient.tsx",
  "src/components/student/StudentProgressClient.tsx",
  "src/components/admin/GroupsListClient.tsx",
  "src/components/teacher/TeacherProfileClient.tsx",
  "src/components/parent/ParentProfileClient.tsx",
  "src/components/shared/FeedbackModal.tsx",
  "src/components/teacher/TeacherStudentsListClient.tsx",
  "src/app/admin/groups/new/page.tsx",
  "src/app/admin/announcements/new/page.tsx",
  "src/components/parent/ParentChildProfileClient.tsx",
  "src/app/teacher/progress/page.tsx",
  "src/app/teacher/evaluations/page.tsx",
  "src/app/teacher/evaluation/new/page.tsx",
  "src/app/teacher/attendance/page.tsx",
  "src/app/admin/announcements/page.tsx",
  "src/app/admin/admins/page.tsx",
  "src/app/teacher/notifications/page.tsx",
  "src/app/student/notifications/page.tsx",
  "src/app/parent/link/page.tsx",
  "src/app/admin/teachers/new/page.tsx",
  "src/app/admin/parents/new/page.tsx",
  "src/app/admin/notifications/page.tsx",
  "src/app/admin/attendance/page.tsx",
  "src/app/admin/announcements/[id]/edit/page.tsx",
  "src/components/teacher/TeacherGroupDetailClient.tsx",
  "src/components/teacher/TeacherStudentDetailClient.tsx",
  "src/components/teacher/TeacherGroupsListClient.tsx",
  "src/components/parent/ParentDashboardClient.tsx",
  "src/components/teacher/TeacherDashboardClient.tsx",
];

function toCamelCase(str) {
  return str
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toLowerCase());
}

function getNamespace(filePath) {
  const parts = filePath.replace(/^src\//, '').replace(/\.tsx$/, '').split(/[\/]/);
  const isPage = parts[parts.length - 1] === 'page';
  if (isPage) parts.pop();
  const meaningful = parts.filter(p => p && !['app','components','admin','teacher','student','parent'].includes(p));
  let name = meaningful.length ? meaningful.map(toCamelCase).join('_') : 'misc';
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

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log('SKIP (not found):', filePath);
    return;
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
    // skip optional `as const`
    const asConst = content.slice(afterBlock, afterBlock + 8);
    if (asConst.trimStart().startsWith('as const')) {
      afterBlock = content.indexOf('const', afterBlock) + 'const'.length;
    }

    // find and remove the inline t function after this T block
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

  if (!replaced) {
    console.log('SKIP (no replacement):', filePath);
    return;
  }

  // update import
  if (content.includes('useLanguage')) {
    content = content.replace(
      /import\s+\{\s*useLanguage\s*\}\s+from\s+["']@\/contexts\/LanguageContext["']/,
      'import { useLanguage, useT } from "@/contexts/LanguageContext"'
    );
  } else {
    content = content.replace(
      /import\s+React\s+from\s+['"]react['"];?\n?/,
      (m) => m + `import { useT } from "@/contexts/LanguageContext"\n`
    );
    if (!content.includes('useT')) {
      content = `import { useT } from "@/contexts/LanguageContext"\n` + content;
    }
  }

  fs.writeFileSync(filePath, content);
  console.log('Migrated:', filePath);
});

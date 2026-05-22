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

const translationsPath = 'src/lib/i18n/translations.ts';
let translationsContent = fs.readFileSync(translationsPath, 'utf8');
const existingSections = new Set();
const sectionRe = /^\s+(\w+):\s*\{/gm;
let sm;
while ((sm = sectionRe.exec(translationsContent)) !== null) {
  existingSections.add(sm[1]);
}

const extracted = {};

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log('SKIP (not found):', filePath);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const tRegex = /const\s+T\s*=\s*\{([\s\S]*?)\n\s*\}(?:\s*as\s+const)?/g;
  const blocks = [];
  let m;
  while ((m = tRegex.exec(content)) !== null) {
    blocks.push({ body: m[1], fullMatch: m[0] });
  }
  if (blocks.length === 0) {
    console.log('SKIP (no T):', filePath);
    return;
  }

  blocks.forEach((block, idx) => {
    let ns = getNamespace(filePath);
    if (blocks.length > 1) ns += `_${idx + 1}`;
    while (existingSections.has(ns)) {
      ns += 'X';
    }
    existingSections.add(ns);

    extracted[ns] = { file: filePath, keys: {} };
    const entryRegex = /(\w+):\s*\{\s*fr:\s*"((?:\\.|[^"\\])*)"\s*,\s*en:\s*"((?:\\.|[^"\\])*)"\s*,\s*ar:\s*"((?:\\.|[^"\\])*)"\s*\}/g;
    let em;
    while ((em = entryRegex.exec(block.body)) !== null) {
      const [, key, fr, en, ar] = em;
      extracted[ns].keys[key] = { fr, en, ar };
    }
    if (Object.keys(extracted[ns].keys).length === 0) {
      delete extracted[ns];
      existingSections.delete(ns);
    }
  });
});

const insertPoint = translationsContent.lastIndexOf('} as const');
const beforeConst = translationsContent.slice(0, insertPoint);
const afterConst = translationsContent.slice(insertPoint);

let insertions = '';
Object.entries(extracted).forEach(([ns, data]) => {
  insertions += `\n  // ─── ${ns} (${data.file.replace(/^src\//,'')}) ─────────────────────────────────────────────\n`;
  insertions += `  ${ns}: {\n`;
  Object.entries(data.keys).forEach(([key, vals]) => {
    const esc = s => JSON.stringify(s);
    const pad = ' '.repeat(Math.max(1, 16 - key.length));
    insertions += `    ${key}:${pad}{ fr: ${esc(vals.fr)}, en: ${esc(vals.en)}, ar: ${esc(vals.ar)} },\n`;
  });
  insertions += `  },\n`;
});

translationsContent = beforeConst + insertions + afterConst;
fs.writeFileSync(translationsPath, translationsContent);
console.log('Updated', translationsPath);
console.log('Sections:', Object.keys(extracted).join(', '));

const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const path = require('node:path');
const dictionaryFile = 'client/src/lib/language-context.tsx';
const dictionarySource = ts.createSourceFile(dictionaryFile, fs.readFileSync(dictionaryFile, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let dictionaries;
function findDictionary(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(dictionarySource) === 'dictionaries') {
    dictionaries = vm.runInNewContext('(' + node.initializer.getText(dictionarySource) + ')');
  }
  ts.forEachChild(node, findDictionary);
}
findDictionary(dictionarySource);
function flatten(object, prefix = '') {
  return Object.fromEntries(Object.entries(object).flatMap(([key, value]) => {
    const name = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'object' && !Array.isArray(value) ? Object.entries(flatten(value, name)) : [[name, value]];
  }));
}
const en = flatten(dictionaries.en), vi = flatten(dictionaries.vi);
console.log('MISSING VI', Object.keys(en).filter(key => !(key in vi)));
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
}
const rows = [];
for (const file of walk('client/src').filter(file => file.endsWith('.tsx') && !file.includes('components\\ui'))) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function scan(node) {
    if (ts.isJsxText(node) && /[A-Za-z]/.test(node.text.trim())) rows.push({ file, line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1, kind: 'text', text: node.text.replace(/\s+/g, ' ').trim() });
    if (ts.isJsxAttribute(node) && ['title', 'placeholder', 'aria-label', 'alt'].includes(node.name.text) && node.initializer && ts.isStringLiteral(node.initializer)) rows.push({ file, line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1, kind: 'attr', text: node.initializer.text });
    if (ts.isJsxExpression(node)) {
      function strings(child) {
        if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child) || ts.isJsxFragment(child)) return;
        if ((ts.isStringLiteral(child) || ts.isNoSubstitutionTemplateLiteral(child)) && /[A-Z][a-z]|[a-z] [a-z]/.test(child.text) && !ts.isCallExpression(child.parent)) rows.push({ file, line: source.getLineAndCharacterOfPosition(child.getStart(source)).line + 1, kind: 'expr', text: child.text });
        ts.forEachChild(child, strings);
      }
      strings(node);
    }
    ts.forEachChild(node, scan);
  }
  scan(source);
}
fs.writeFileSync('tmp/translation-audit.json', JSON.stringify(rows, null, 2));
for (const row of rows) console.log(`${row.file}:${row.line} ${row.kind} ${row.text}`);

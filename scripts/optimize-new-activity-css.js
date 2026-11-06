'use strict';

// Deliberately limited to the simple rules emitted for this Axure page.
// Unsupported syntax fails before either the backup or target is written.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const pageName = '\u65b0\u589e\u6d3b\u52a8';
const target = path.resolve(__dirname, '..', 'files', pageName, 'styles.css');

function parse(source) {
  if (/\/\*|\*\/|@/.test(source)) throw new Error('Unsupported CSS comment or at-rule');
  const rules = [];
  let offset = 0;
  while (offset < source.length) {
    while (/\s/.test(source[offset] || '') && offset < source.length) offset++;
    if (offset === source.length) break;
    const open = source.indexOf('{', offset);
    if (open < 0) throw new Error('Unconsumed CSS content');
    const selectors = source.slice(offset, open).trim().split(',').map(value => value.trim());
    for (const selector of selectors) {
      if (!/^(?:[a-zA-Z][\w-]*|[.#][\w-]+)(?:[.#][\w-]+)*(?: (?:[a-zA-Z][\w-]*|[.#][\w-]+)(?:[.#][\w-]+)*)*$/.test(selector)) throw new Error('Unsupported selector: ' + selector);
    }
    let quote = null, escaped = false, parens = 0, close = open + 1;
    for (; close < source.length; close++) {
      const char = source[close];
      if (quote) {
        if (char === '\n' || char === '\r') throw new Error('Multiline CSS string');
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === quote) quote = null;
        continue;
      }
      if (char === '"' || char === "'") quote = char;
      else if (char === '(') parens++;
      else if (char === ')') { if (--parens < 0) throw new Error('Unbalanced CSS parentheses'); }
      else if (char === '{') throw new Error('Nested CSS rule');
      else if (char === '}') { if (parens) throw new Error('Unbalanced CSS value'); break; }
    }
    if (close === source.length || quote || parens) throw new Error('Unterminated CSS rule');
    const lines = source.slice(open + 1, close).split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    for (const line of lines) {
      if (!/^-{0,2}[a-zA-Z][a-zA-Z0-9-]*\s*:.*;$/.test(line)) throw new Error('Unsupported declaration layout: ' + line);
    }
    rules.push({ selectors, body: lines.join('') });
    offset = close + 1;
  }
  return rules;
}
function expand(rules) {
  return rules.filter(rule => rule.body).flatMap(rule => rule.selectors.map(selector => ({ selector, body: rule.body })));
}
function optimize(source) {
  const original = parse(source), merged = [];
  for (const rule of original) {
    if (!rule.body) continue;
    const previous = merged[merged.length - 1];
    if (previous && previous.body === rule.body) previous.selectors.push(...rule.selectors);
    else merged.push({ selectors: [...rule.selectors], body: rule.body });
  }
  const output = merged.map(rule => rule.selectors.join(',') + '{' + rule.body + '}').join('\n') + '\n';
  assert.deepStrictEqual(expand(parse(output)), expand(original), 'CSS rule sequence changed');
  return { output, before: original.length, after: merged.length, nonemptyExpanded: expand(original).length };
}
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--write' && arg !== '--check') || (args.includes('--write') && args.includes('--check'))) throw new Error('Usage: node scripts/optimize-new-activity-css.js [--write|--check]');
  const source = fs.readFileSync(target, 'utf8'), result = optimize(source);
  assert.equal(optimize(result.output).output, result.output, 'CSS optimization is not idempotent');
  let backup = null;
  if (args.includes('--write') && source !== result.output) {
    backup = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'new-activity-css-')), 'styles.original.css');
    fs.writeFileSync(backup, source, { encoding: 'utf8', flag: 'wx' });
    assert.equal(fs.readFileSync(backup, 'utf8'), source, 'CSS backup verification failed');
    fs.writeFileSync(target, result.output, 'utf8');
    assert.equal(fs.readFileSync(target, 'utf8'), result.output, 'CSS write verification failed');
  }
  console.log(JSON.stringify({ mode: args.includes('--write') ? 'write' : 'check', bytesBefore: Buffer.byteLength(source), bytesAfter: Buffer.byteLength(result.output), rulesBefore: result.before, rulesAfter: result.after, expandedNonemptyRules: result.nonemptyExpanded, sequenceEquivalent: true, idempotent: true, alreadyOptimized: source === result.output, backup }, null, 2));
}
module.exports = { parse, optimize, expand };

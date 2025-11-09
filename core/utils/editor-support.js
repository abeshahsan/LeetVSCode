// Utilities to manage the editor support block injection/stripping

const LINE = '===== EDITOR SUPPORT BLOCK =====';
const LINE_END = '===== END EDITOR SUPPORT BLOCK =====';

function linePrefixFor(langSlug = '') {
  const slug = (langSlug || '').toLowerCase();
  // Languages supporting // comments
  const doubleSlash = new Set([
    'javascript','typescript','cpp','c','java','csharp','go','kotlin','swift','scala','rust','dart','typescriptreact','javascriptreact'
  ]);
  if (doubleSlash.has(slug)) return '//';
  if (slug === 'python' || slug === 'python3' || slug === 'ruby') return '#';
  if (slug === 'php') return '//'; // Will be placed after <?php
  // default to // which is safe for many
  return '//';
}

export function makeEditorSupportBlock(langSlug) {
  const p = linePrefixFor(langSlug);
  const headerLines = [
    `${p} ${LINE}`,
    `${p} Write necessary includes and definitions here.`,
    `${p} Like headers, imports, TreeNode structure, etc.`,
    `${p} This block is for editor support and won't be part of the final submission.`,
    `${p} We will exclude this section before sending the code to LeetCode.`,
    `${p} `,
    `${p} For example:`,
    `${p} #include <bits/stdc++.h>`,
    `${p} using namespace std;`,
    `${p} `,
    `${p} struct TreeNode {`,
    `${p}     int val;`,
    `${p}     TreeNode *left;`,
    `${p}     TreeNode *right;`,
    `${p}     TreeNode() : val(0), left(nullptr), right(nullptr) {}`,
    `${p}     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}`,
    `${p}     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}`,
    `${p} };`,
    `${p} ${LINE_END}`,
    '',
  ];
  return headerLines.join('\n');
}

export function injectEditorSupport(content, langSlug) {
  if (!content || typeof content !== 'string') return makeEditorSupportBlock(langSlug);
  const block = makeEditorSupportBlock(langSlug);
  const slug = (langSlug || '').toLowerCase();
  if (slug === 'php') {
    const phpTagIdx = content.indexOf('<?php');
    if (phpTagIdx !== -1) {
      const afterTagIdx = phpTagIdx + '<?php'.length;
      const before = content.slice(0, afterTagIdx);
      const after = content.slice(afterTagIdx);
      return `${before}\n${block}${after.startsWith('\n') ? after.slice(1) : after}`;
    }
    // If no tag, just prepend; not ideal but better than invalid comments outside PHP
    return `<?php\n${block}${content}`;
  }
  return block + content;
}

export function stripEditorSupport(content) {
  if (!content || typeof content !== 'string') return content;
  const start = content.indexOf(LINE);
  const end = content.indexOf(LINE_END);
  if (start === -1 || end === -1 || end < start) return content;
  const before = content.slice(0, start);
  const after = content.slice(end + LINE_END.length);
  // normalize extra newline left behind
  return (before.endsWith('\n') ? before : before + (before ? '\n' : '')) + after.replace(/^\n/, '');
}

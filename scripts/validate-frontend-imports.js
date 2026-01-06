/*
  Lightweight validator for static frontend module paths.

  - Checks that local <script src> / <link href> references in frontend/*.html exist
  - Checks that relative ES module imports in frontend/js (recursive) resolve to existing files

  Usage:
    node scripts/validate-frontend-imports.js
*/

const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const frontendRoot = path.join(repoRoot, 'frontend');
const jsRoot = path.join(frontendRoot, 'js');

function walkFiles(dir, predicate) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(full, predicate));
      continue;
    }
    if (predicate(full)) out.push(full);
  }
  return out;
}

function normalizeForDisplay(p) {
  return path.relative(repoRoot, p).replaceAll(path.sep, '/');
}

function checkHtmlAssets() {
  const htmlFiles = walkFiles(frontendRoot, (p) => p.endsWith('.html'));
  const missing = [];

  const tagRe = /<(script|link)\b[^>]*(src|href)=["']([^"'#]+)["'][^>]*>/gi;

  for (const htmlPath of htmlFiles) {
    const page = path.basename(htmlPath);
    const content = fs.readFileSync(htmlPath, 'utf8');

    let m;
    while ((m = tagRe.exec(content))) {
      const url = m[3];
      if (/^https?:\/\//i.test(url)) continue;

      const local = url.replace(/^\//, '');
      const target = path.join(frontendRoot, local);
      if (!fs.existsSync(target)) {
        missing.push({ page, url, resolved: normalizeForDisplay(target) });
      }
    }
  }

  return missing;
}

function extractImportSpecifiers(jsSource) {
  const specifiers = [];

  // Avoid false positives from documentation/examples in comments.
  // This is a lightweight heuristic (not a full JS parser).
  const source = jsSource
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  // import ... from "..." / export ... from "..."
  const fromRe = /\b(?:import|export)\b[\s\S]*?\bfrom\s+["']([^"']+)["']/g;
  // import("...")
  const dynamicRe = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;

  let m;
  while ((m = fromRe.exec(source))) specifiers.push(m[1]);
  while ((m = dynamicRe.exec(source))) specifiers.push(m[1]);

  return specifiers;
}

function checkJsImports() {
  const jsFiles = walkFiles(jsRoot, (p) => p.endsWith('.js'));
  const missing = [];

  for (const jsPath of jsFiles) {
    const content = fs.readFileSync(jsPath, 'utf8');
    const specs = extractImportSpecifiers(content);

    for (const spec of specs) {
      if (/^(https?:)?\/\//i.test(spec)) continue;
      if (!(spec.startsWith('./') || spec.startsWith('../'))) continue;

      const target = path.resolve(path.dirname(jsPath), spec);
      if (!fs.existsSync(target)) {
        missing.push({
          file: normalizeForDisplay(jsPath),
          spec,
          resolved: normalizeForDisplay(target),
        });
      }
    }
  }

  return missing;
}

function main() {
  const htmlMissing = checkHtmlAssets();
  const jsMissing = checkJsImports();

  if (htmlMissing.length === 0 && jsMissing.length === 0) {
    console.log('OK: frontend asset refs + JS imports resolve');
    return;
  }

  if (htmlMissing.length) {
    console.error('Missing HTML asset refs:');
    for (const m of htmlMissing) {
      console.error(`- ${m.page}: ${m.url} (resolved ${m.resolved})`);
    }
  }

  if (jsMissing.length) {
    console.error('Missing JS import targets:');
    for (const m of jsMissing) {
      console.error(`- ${m.file}: ${m.spec} (resolved ${m.resolved})`);
    }
  }

  process.exit(1);
}

main();

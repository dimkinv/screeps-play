#!/usr/bin/env node

/*
  tools/flatten-dist.js
  Usage: node tools/flatten-dist.js <inputDir> <outputDir>

  This script flattens a compiled TypeScript output (JS files) from a tree structure
  into a single-level set of files whose filenames represent the original path with dots.
  For example: `lib/somefolder/file.js` -> `lib.somefolder.file.js`.

  It also rewrites import/require specifiers inside files to use the new flattened names.
*/

const fs = require('fs');
const path = require('path');

function printUsageAndExit() {
  console.error('Usage: node tools/flatten-dist.js <inputDir> <outputDir>');
  process.exit(1);
}

const args = process.argv.slice(2);
const inputDir = args[0] || 'temp-dist';
const outputDir = args[1] || 'dist';

if (!fs.existsSync(inputDir)) {
  console.error('Input dir does not exist:', inputDir);
  process.exit(1);
}

function listFilesRec(dir) {
  let results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(listFilesRec(full));
    } else if (item.isFile()) {
      results.push(full);
    }
  }
  return results;
}

// Build mapping of absolute path -> flattened name without extension
const files = listFilesRec(inputDir);

const mapping = new Map();
for (const file of files) {
  const rel = path.relative(inputDir, file);
  const posixRel = rel.split(path.sep).join('/');
  const ext = path.extname(posixRel);
  const noext = posixRel.slice(0, -ext.length);
  let flattened = noext.split('/').join('.');
  // Special-case: The Screeps 'instance' file is `play/main` and should be output as `main.js`
  // so that the runtime loads `main.js` at top-level instead of `play.main.js`.
  if (noext === 'play/main') {
    flattened = 'main';
  }
  // store both extful and extless forms (use extless when rewriting imports)
  mapping.set(path.resolve(file), { flattened, ext });
}

function ensureDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

// Remove existing output dir contents first — this prevents old files from persisting
// (for example `play.main.js`) which may cause the Screeps runtime to load a module
// twice (both `main.js` and `play.main.js`). Always start from a clean directory.
try {
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
} catch (err) {
  console.error('Failed to clean output dir', outputDir, err);
  // continue — we'll attempt to create the dir below
}
ensureDir(outputDir);

// Utility to find a mapping for a resolved import path
function findMappingForResolved(resolvedPath) {
  const candidates = [];
  const extCandidates = ['.js', '.mjs', '.cjs', '.ts'].filter(Boolean);
  candidates.push(resolvedPath);
  for (const ext of extCandidates) candidates.push(resolvedPath + ext);
  if (!path.extname(resolvedPath)) {
    // also try index variants
    for (const ext of ['.js', '.mjs', '.cjs']) {
      candidates.push(path.join(resolvedPath, 'index' + ext));
    }
  }
  for (const cand of candidates) {
    const abs = path.resolve(cand);
    if (mapping.has(abs)) return mapping.get(abs);
  }
  return null;
}

function rewriteImportSpecifiers(content, fileAbs) {
  // rewrite require('...'), import ... from '...', export * from '...', dynamic import('...')
  const reqRegex = /(require\s*\(\s*['"])([^'"]+)(['"]\s*\))/g;
  const importFromRegex = /((?:import[\s\S]*?from|export\s+\*\s+from)\s+['"])([^'"]+)(['"])/g;
  const dynamicImportRegex = /(import\s*\(\s*['"])([^'"]+)(['"]\s*\))/g;

  function replaceCallback(match, p1, spec, p3) {
    // spec is original module path
    const resolved = resolveImportPath(fileAbs, spec);
    if (!resolved) return match; // no change
    return p1 + resolved + p3;
  }

  // apply in series
  content = content.replace(reqRegex, replaceCallback);
  content = content.replace(importFromRegex, replaceCallback);
  content = content.replace(dynamicImportRegex, replaceCallback);
  return content;
}

function resolveImportPath(fromFileAbs, spec) {
  // If it's a core or npm module or absolute like '/node_modules' or begins without lib/play/src, skip
  if (!spec) return null;
  if (spec.startsWith('.')) {
    // relative: resolve
    const resolved = path.resolve(path.dirname(fromFileAbs), spec);
    const mapped = findMappingForResolved(resolved);
    if (mapped) return mapped.flattened; // without extension
    return null;
  }

  // Non-relative: could be absolute path local module like 'lib/foo'
  // Accept those starting with 'lib/' or 'play/' or 'src/'
  const localPrefixes = ['lib/', 'play/', 'src/'];
  for (const pref of localPrefixes) {
    if (spec.startsWith(pref)) {
      const resolved = path.resolve(inputDir, spec);
      const mapped = findMappingForResolved(resolved);
      if (mapped) return mapped.flattened;
      // maybe spec has extension already
      const maybeResolved = path.resolve(inputDir, spec);
      const mapped2 = findMappingForResolved(maybeResolved);
      if (mapped2) return mapped2.flattened;
    }
  }

  // Not a local module we know; leave alone
  return null;
}

// Process files: rewrite content, write to output directory as flattened file
for (const file of files) {
  const abs = path.resolve(file);
  const info = mapping.get(abs);
  if (!info) continue;
  const outName = info.flattened + info.ext; // keep extension
  const outPath = path.join(outputDir, outName);
  ensureDir(path.dirname(outPath));

  let content = fs.readFileSync(abs, 'utf8');

  // Only rewrite JS, MJS, CJS files and possibly JSON
  if (['.js', '.mjs', '.cjs'].includes(info.ext.toLowerCase())) {
    try {
      content = rewriteImportSpecifiers(content, abs);
    } catch (err) {
      console.error('Failed to rewrite imports for', abs, err);
    }
  }

  fs.writeFileSync(outPath, content, 'utf8');
  console.log('Wrote', outPath);
}

console.log('\nFlattening complete.');

process.exit(0);

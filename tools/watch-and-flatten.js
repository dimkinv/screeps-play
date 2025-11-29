#!/usr/bin/env node

// tools/watch-and-flatten.js
// Spawns `tsc --watch` and watches the `temp-dist` folder to re-run the flatten script
// when files are emitted by TypeScript.

const { spawn } = require('child_process');
const chokidar = require('chokidar');
const path = require('path');
const { exec } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const inputDir = process.argv[2] || path.join(projectRoot, 'temp-dist');
const outDir = process.argv[3] || path.join(projectRoot, 'dist');

function spawnTscWatch() {
  const tscBin = path.resolve(projectRoot, 'node_modules', '.bin', 'tsc');
  const tscArgs = ['-p', 'tsconfig.json', '--outDir', inputDir, '--watch'];
  console.log('Spawning tsc watch: %s %s', tscBin, tscArgs.join(' '));
  const proc = spawn(tscBin, tscArgs, { cwd: projectRoot, shell: true, stdio: 'inherit' });
  proc.on('close', (code) => {
    console.log('tsc watch exited with code', code);
  });
  return proc;
}

let debounceTimer = null;
const DEBOUNCE_MS = 200;

function doFlatten() {
  console.log('\nRunning flatten...');
  const cmd = `node "${path.join(projectRoot, 'tools', 'flatten-dist.js')}" "${inputDir}" "${outDir}"`;
  exec(cmd, { cwd: projectRoot }, (err, stdout, stderr) => {
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    if (err) console.error('Flatten script error:', err);
  });
}

function startWatcher() {
  // chokidar watcher for all files under temp-dist
  const watcher = chokidar.watch(inputDir, {
    ignored: /(^|[\\])\../, // ignore dotfiles
    ignoreInitial: true,
    persistent: true,
  });
  watcher.on('all', (event, changedPath) => {
    // console.log('watch event', event, changedPath)
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      doFlatten();
    }, DEBOUNCE_MS);
  });
  // Also run an initial flatten
  doFlatten();
}

function main() {
  spawnTscWatch();
  startWatcher();
  // Keep process alive until killed.
}

main();

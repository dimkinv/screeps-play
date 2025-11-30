#!/usr/bin/env node

// tools/watch-and-upload.js
// Watches TypeScript output, flattens it, and uploads to Screeps on every change.

const { spawn } = require('child_process');
const chokidar = require('chokidar');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const inputDir = process.argv[2] || path.join(projectRoot, 'temp-dist');
const outDir = process.argv[3] || path.join(projectRoot, 'dist');
const flattenScript = path.join(projectRoot, 'tools', 'flatten-dist.js');
const uploadScript = path.join(projectRoot, 'tools', 'upload-screeps.js');

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

function runNodeScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], { cwd: projectRoot, stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${path.basename(scriptPath)} exited with code ${code}`));
      }
    });
  });
}

const DEBOUNCE_MS = 200;
let debounceTimer = null;
let running = false;
let pending = false;

async function executeSequence() {
  running = true;
  console.log('\nRunning flatten + upload...');
  try {
    await runNodeScript(flattenScript, [inputDir, outDir]);
    await runNodeScript(uploadScript);
  } catch (error) {
    console.error('Pipeline error:', error.message);
  } finally {
    running = false;
    if (pending) {
      pending = false;
      scheduleRun();
    }
  }
}

function scheduleRun() {
  if (running) {
    pending = true;
    return;
  }
  executeSequence();
}

function startWatcher() {
  const watcher = chokidar.watch(inputDir, {
    ignored: /(^|[\\])\../,
    ignoreInitial: true,
    persistent: true,
  });
  watcher.on('all', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      scheduleRun();
    }, DEBOUNCE_MS);
  });
  scheduleRun();
}

function main() {
  spawnTscWatch();
  startWatcher();
}

main();

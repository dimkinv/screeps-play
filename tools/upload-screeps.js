#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const dotenv = require('dotenv');
const { HttpsProxyAgent } = require('https-proxy-agent');

dotenv.config();

const distDir = path.resolve(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  console.error('Build output directory "dist" not found. Run "pnpm run build" first.');
  process.exit(1);
}

const email = process.env.SCREEPS_EMAIL || process.env.SCREEPS_USERNAME;
const password = process.env.SCREEPS_PASSWORD;
const branch = process.env.SCREEPS_BRANCH || 'default';
const hostname = process.env.SCREEPS_HOST || 'screeps.com';
const proxyUrl = process.env.SCREEPS_PROXY || 'http://localhost:8088';

if (!email || !password) {
  console.error('Missing Screeps credentials. Set SCREEPS_EMAIL (or SCREEPS_USERNAME) and SCREEPS_PASSWORD in your environment or .env file.');
  process.exit(1);
}

function collectModules(rootDir) {
  const modules = {};
  const stack = [rootDir];

  while (stack.length > 0) {
    const currentDir = stack.pop();
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (path.extname(entry.name) !== '.js') {
        continue;
      }
      const relative = path.relative(distDir, fullPath);
      const moduleName = relative.replace(/\.js$/u, '').replace(/\\/gu, '/');
      modules[moduleName] = fs.readFileSync(fullPath, 'utf8');
    }
  }

  return modules;
}

const modules = collectModules(distDir);
if (Object.keys(modules).length === 0) {
  console.error('No JavaScript modules found in "dist". Ensure the build completed successfully.');
  process.exit(1);
}

const payload = JSON.stringify({
  branch,
  modules
});

const requestOptions = {
  hostname,
  port: 443,
  path: '/api/user/code',
  method: 'POST',
  auth: `${email}:${password}`,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload)
  }
};

if (proxyUrl) {
  requestOptions.agent = new HttpsProxyAgent(proxyUrl);
  console.log(`Uploading via proxy ${proxyUrl}`);
}

const req = https.request(requestOptions, res => {
  let body = '';
  res.setEncoding('utf8');
  res.on('data', chunk => {
    body += chunk;
  });
  res.on('end', () => {
    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
      console.log(`Uploaded ${Object.keys(modules).length} modules to branch "${branch}" on ${hostname}.`);
      return;
    }

    console.error(`Upload failed with status ${res.statusCode ?? 'unknown'}.`);
    if (body) {
      try {
        const parsed = JSON.parse(body);
        console.error(JSON.stringify(parsed, null, 2));
      } catch (error) {
        console.error(body);
      }
    }
    process.exitCode = 1;
  });
});

req.on('error', error => {
  console.error('Upload request failed:', error.message);
  process.exit(1);
});

req.write(payload);
req.end();

#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const toolStateDir = path.join(os.homedir(), '.chapter-reader-installer');

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const result = {
    repo: '',
    assetRegex: '^chapter-reader-.*\\.vsix$',
    downloadDir: path.join(toolStateDir, 'downloads'),
    stateFile: path.join(toolStateDir, 'state.json'),
    intervalSec: 0,
    includePrerelease: false,
    forceInstall: false,
    dryRun: false,
    cursorBin: process.env.CURSOR_BIN || ''
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    switch (value) {
      case '--repo':
        result.repo = argv[index + 1] || '';
        index += 1;
        break;
      case '--asset-regex':
        result.assetRegex = argv[index + 1] || '';
        index += 1;
        break;
      case '--download-dir':
        result.downloadDir = argv[index + 1] || '';
        index += 1;
        break;
      case '--state-file':
        result.stateFile = argv[index + 1] || '';
        index += 1;
        break;
      case '--interval-sec':
        result.intervalSec = Number(argv[index + 1] || '0');
        index += 1;
        break;
      case '--include-prerelease':
        result.includePrerelease = normalizeBool(argv[index + 1] || '');
        index += 1;
        break;
      case '--cursor-bin':
        result.cursorBin = argv[index + 1] || '';
        index += 1;
        break;
      case '--force':
        result.forceInstall = true;
        break;
      case '--dry-run':
        result.dryRun = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
      default:
        fail(`unknown argument: ${value}`);
    }
  }

  return result;
}

function normalizeBool(value) {
  if (value === 'yes' || value === 'true') {
    return true;
  }
  if (value === 'no' || value === 'false') {
    return false;
  }
  fail(`invalid boolean value: ${value}`);
}

function printHelp() {
  console.log(`Usage:
  npm run install:latest
  npm run install:latest -- --interval-sec 300

Options:
  --repo                GitHub repo slug (owner/name). Default: infer from git origin
  --asset-regex         Regex for release asset name. Default: ^chapter-reader-.*\\.vsix$
  --download-dir        Directory to store downloaded vsix files
  --state-file          File to track last installed release
  --interval-sec        Polling interval in seconds (0 means run once)
  --include-prerelease  yes|no, default no
  --cursor-bin          Cursor CLI path (or use CURSOR_BIN env)
  --force               Force install even if state says already installed
  --dry-run             Print target release/asset only, do not install
  --help                Show this help

Environment:
  GH_TOKEN / GITHUB_TOKEN   Optional GitHub token (recommended for private repos)
  CURSOR_BIN                Optional path to cursor CLI executable
`);
}

function runCapture(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();
  } catch (error) {
    const stderr = error.stderr ? String(error.stderr).trim() : '';
    fail(stderr || `${command} ${args.join(' ')} failed`);
  }
}

function parseRepoFromRemote(remoteUrl) {
  const sshMatch = /^git@github\.com:(.+?)\/(.+?)(?:\.git)?$/.exec(remoteUrl);
  if (sshMatch) {
    return `${sshMatch[1]}/${sshMatch[2]}`;
  }

  const httpsMatch = /^https:\/\/github\.com\/(.+?)\/(.+?)(?:\.git)?$/.exec(remoteUrl);
  if (httpsMatch) {
    return `${httpsMatch[1]}/${httpsMatch[2]}`;
  }

  return '';
}

function inferRepoSlug() {
  const remote = runCapture('git', ['remote', 'get-url', 'origin']);
  const slug = parseRepoFromRemote(remote);
  if (!slug) {
    fail(`cannot parse GitHub repo slug from origin: ${remote}`);
  }
  return slug;
}

function loadState(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return {};
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveState(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function fetchJson(url, token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'chapter-reader-installer'
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`GitHub API ${url} failed: ${response.status} ${response.statusText} ${text}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function getLatestRelease(repo, includePrerelease, token) {
  if (!includePrerelease) {
    try {
      return await fetchJson(`https://api.github.com/repos/${repo}/releases/latest`, token);
    } catch (error) {
      if (error.status === 404) {
        // Fallback below.
      } else {
        throw error;
      }
    }
  }

  const releases = await fetchJson(`https://api.github.com/repos/${repo}/releases?per_page=20`, token);
  const target = releases.find((item) => !item.draft && (includePrerelease || !item.prerelease));
  if (!target) {
    fail(`no available release found in ${repo}; publish a release first`);
  }
  return target;
}

function pickVsixAsset(release, assetRegex) {
  let matcher;
  try {
    matcher = new RegExp(assetRegex);
  } catch (error) {
    fail(`invalid asset regex: ${error.message}`);
  }

  const assets = (release.assets || []).filter((asset) => asset.name.toLowerCase().endsWith('.vsix'));
  if (assets.length === 0) {
    fail(`release ${release.tag_name} has no .vsix asset`);
  }

  return assets.find((asset) => matcher.test(asset.name)) || assets[0];
}

async function downloadAsset(asset, targetDir, token) {
  fs.mkdirSync(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, asset.name);
  const tmpPath = `${targetPath}.tmp-${Date.now()}`;
  const headers = {
    Accept: 'application/octet-stream',
    'User-Agent': 'chapter-reader-installer'
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(asset.browser_download_url, {
    headers,
    redirect: 'follow'
  });

  if (!response.ok) {
    const text = await response.text();
    fail(`download failed: ${response.status} ${response.statusText} ${text}`);
  }

  const data = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(tmpPath, data);
  fs.renameSync(tmpPath, targetPath);
  return targetPath;
}

function installVsix(vsixPath, cursorBin) {
  const candidates = [];
  if (cursorBin) {
    candidates.push(cursorBin);
  }
  if (process.platform === 'win32') {
    candidates.push('cursor.cmd', 'cursor.exe', 'cursor');
  } else {
    candidates.push('cursor');
  }

  for (const bin of candidates) {
    const result = spawnSync(bin, ['--install-extension', vsixPath, '--force'], {
      stdio: 'inherit',
      shell: false
    });
    if (result.error && result.error.code === 'ENOENT') {
      continue;
    }
    if (result.error) {
      fail(`failed to run ${bin}: ${result.error.message}`);
    }
    if (result.status !== 0) {
      fail(`${bin} exited with code ${result.status}`);
    }
    return bin;
  }

  fail('cannot find Cursor CLI. Set CURSOR_BIN or pass --cursor-bin');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runOnce(config) {
  const repo = config.repo || inferRepoSlug();
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
  const release = await getLatestRelease(repo, config.includePrerelease, token);
  const asset = pickVsixAsset(release, config.assetRegex);
  const releaseKey = `${release.tag_name}:${asset.name}`;
  const releaseUrl = release.html_url || `https://github.com/${repo}/releases/tag/${release.tag_name}`;
  const state = loadState(config.stateFile);

  if (!config.forceInstall && state.releaseKey === releaseKey) {
    console.log(`Already installed latest: ${release.tag_name} (${asset.name})`);
    return { changed: false, releaseTag: release.tag_name, releaseUrl };
  }

  console.log(`Target release: ${release.tag_name}`);
  console.log(`Target asset: ${asset.name}`);
  console.log(`Release URL: ${releaseUrl}`);

  if (config.dryRun) {
    return { changed: false, releaseTag: release.tag_name, releaseUrl };
  }

  const localFile = await downloadAsset(asset, config.downloadDir, token);
  const usedBin = installVsix(localFile, config.cursorBin);
  saveState(config.stateFile, {
    releaseKey,
    releaseTag: release.tag_name,
    assetName: asset.name,
    installedAt: new Date().toISOString(),
    releaseUrl
  });

  console.log(`Installed via ${usedBin}: ${localFile}`);
  return { changed: true, releaseTag: release.tag_name, releaseUrl };
}

async function runLoop(config) {
  while (true) {
    try {
      await runOnce(config);
    } catch (error) {
      console.error(`ERROR: ${error.message || String(error)}`);
    }
    await sleep(config.intervalSec * 1000);
  }
}

async function main() {
  const config = parseArgs(process.argv.slice(2));
  if (!Number.isInteger(config.intervalSec) || config.intervalSec < 0) {
    fail('--interval-sec must be an integer >= 0');
  }

  if (config.intervalSec > 0) {
    console.log(`Polling every ${config.intervalSec} seconds...`);
    await runLoop(config);
    return;
  }

  await runOnce(config);
}

main().catch((error) => {
  fail(error.message || String(error));
});

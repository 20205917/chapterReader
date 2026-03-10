#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const worklogPath = path.join(rootDir, 'docs', 'ai-worklog.md');
const manualQaTemplatePath = path.join(rootDir, 'docs', 'manual-qa-template.md');

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  const execOptions = {
    cwd: rootDir,
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    encoding: options.capture ? 'utf8' : undefined
  };

  try {
    return execFileSync(command, args, execOptions);
  } catch (error) {
    if (options.capture) {
      const stderr = error.stderr ? String(error.stderr).trim() : '';
      fail(stderr || `${command} ${args.join(' ')} failed`);
    }
    throw error;
  }
}

function commandExists(name) {
  try {
    execFileSync('bash', ['-lc', `command -v ${name}`], {
      cwd: rootDir,
      stdio: 'ignore'
    });
    return true;
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  const result = {
    bump: 'patch',
    keep: false,
    manualQa: false,
    retention: 3,
    allowMajor: false,
    summary: '',
    version: ''
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    switch (value) {
      case '--summary':
        result.summary = argv[index + 1] || '';
        index += 1;
        break;
      case '--bump':
        result.bump = argv[index + 1] || '';
        index += 1;
        break;
      case '--version':
        result.version = argv[index + 1] || '';
        index += 1;
        break;
      case '--manual-qa':
        result.manualQa = normalizeBool(argv[index + 1] || '');
        index += 1;
        break;
      case '--keep':
        result.keep = true;
        break;
      case '--retention':
        result.retention = Number(argv[index + 1] || '3');
        index += 1;
        break;
      case '--allow-major':
        result.allowMajor = true;
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
  npm run release:task -- --summary "修复章节跳转" [--bump patch|minor|major]
  npm run release:task -- --summary "首个正式版本" --version 1.0.0

Options:
  --summary      required, release summary shown in commit and release title
  --bump         patch | minor | major, default patch
  --version      exact version, overrides bump
  --manual-qa    yes | no, default no
  --keep         mark release title with [keep]
  --retention    number of non-[keep] releases to retain, default 3
  --allow-major  required together with --bump major
  --help         show this help
`);
}

function parseSemver(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
  if (!match) {
    fail(`invalid semver: ${value}`);
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3])
  };
}

function compareSemver(left, right) {
  if (left.major !== right.major) {
    return left.major - right.major;
  }
  if (left.minor !== right.minor) {
    return left.minor - right.minor;
  }
  return left.patch - right.patch;
}

function formatSemver(version) {
  return `${version.major}.${version.minor}.${version.patch}`;
}

function bumpVersion(current, bump) {
  const next = { ...current };
  switch (bump) {
    case 'patch':
      next.patch += 1;
      return next;
    case 'minor':
      next.minor += 1;
      next.patch = 0;
      return next;
    case 'major':
      next.major += 1;
      next.minor = 0;
      next.patch = 0;
      return next;
    default:
      fail(`unsupported bump type: ${bump}`);
  }
}

function getRemoteInfo() {
  const remoteUrl = run('git', ['remote', 'get-url', 'origin'], { capture: true }).trim();
  const sshMatch = /^git@github\.com:(.+?)\/(.+?)(?:\.git)?$/.exec(remoteUrl);
  if (sshMatch) {
    return {
      slug: `${sshMatch[1]}/${sshMatch[2]}`,
      webUrl: `https://github.com/${sshMatch[1]}/${sshMatch[2]}`
    };
  }

  const httpsMatch = /^https:\/\/github\.com\/(.+?)\/(.+?)(?:\.git)?$/.exec(remoteUrl);
  if (httpsMatch) {
    return {
      slug: `${httpsMatch[1]}/${httpsMatch[2]}`,
      webUrl: `https://github.com/${httpsMatch[1]}/${httpsMatch[2]}`
    };
  }

  fail(`unsupported origin remote: ${remoteUrl}`);
}

function assertEnvironment() {
  ['git', 'npm', 'npx', 'gh'].forEach((command) => {
    if (!commandExists(command)) {
      fail(`required command not found: ${command}`);
    }
  });

  const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { capture: true }).trim();
  if (branch !== 'main') {
    fail(`release must run on main, current branch is ${branch}`);
  }

  run('gh', ['auth', 'status']);
}

function appendWorklogEntry(data) {
  const entry = [
    '',
    `## ${data.date} - ${data.summary}`,
    '',
    `- 日期：${data.date}`,
    `- 任务摘要：${data.summary}`,
    `- 版本号：${data.version}`,
    `- 验证命令结果：npm run compile: OK; npm test: OK; npx @vscode/vsce package: OK`,
    `- Release 链接：${data.releaseUrl}`,
    '- Commit Hash：待提交',
    `- 人工验收：${data.manualQa ? '是' : '否'}`,
    `- 备注：Tag ${data.tag}${data.keep ? '；长期保留版本' : ''}`,
    ''
  ].join('\n');

  fs.appendFileSync(worklogPath, entry, 'utf8');
}

function renderManualQaChecklist(data) {
  const template = fs.readFileSync(manualQaTemplatePath, 'utf8');
  return template
    .replaceAll('{{version}}', data.version)
    .replaceAll('{{tag}}', data.tag)
    .replaceAll('{{release_url}}', data.releaseUrl)
    .replaceAll('{{summary}}', data.summary);
}

function listReleases(slug) {
  const raw = run('gh', ['api', `repos/${slug}/releases?per_page=100`], { capture: true });
  return JSON.parse(raw);
}

function pruneReleases(slug, retention) {
  const releases = listReleases(slug)
    .filter((release) => !release.draft)
    .filter((release) => !(release.name || '').startsWith('[keep]'))
    .sort((left, right) => {
      const leftTime = new Date(left.published_at || left.created_at).getTime();
      const rightTime = new Date(right.published_at || right.created_at).getTime();
      return rightTime - leftTime;
    });

  const removable = releases.slice(retention);
  removable.forEach((release) => {
    run('gh', ['release', 'delete', release.tag_name, '--yes']);
  });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.summary.trim()) {
    fail('--summary is required');
  }
  if (!Number.isInteger(args.retention) || args.retention < 1) {
    fail('--retention must be an integer greater than 0');
  }
  if (args.version && args.bump !== 'patch') {
    fail('--version cannot be used together with --bump');
  }
  if (!args.version && !['patch', 'minor', 'major'].includes(args.bump)) {
    fail('--bump must be patch, minor, or major');
  }
  if (args.bump === 'major' && !args.allowMajor) {
    fail('major bump requires --allow-major');
  }

  assertEnvironment();

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = parseSemver(packageJson.version);
  const workflowBaseline = parseSemver('1.0.0');
  let targetVersion = args.version;

  if (!targetVersion) {
    if (compareSemver(currentVersion, workflowBaseline) < 0) {
      targetVersion = '1.0.0';
    } else {
      targetVersion = formatSemver(bumpVersion(currentVersion, args.bump));
    }
  }

  const targetParsed = parseSemver(targetVersion);
  if (!args.allowMajor && compareSemver(targetParsed, workflowBaseline) >= 0 && targetParsed.major > currentVersion.major) {
    fail('target version increases major; rerun with --allow-major after explicit user approval');
  }

  const remoteInfo = getRemoteInfo();
  const tag = `v${targetVersion}`;
  const keepPrefix = args.keep ? '[keep] ' : '';
  const releaseTitle = `${keepPrefix}${tag} - ${args.summary.trim()}`;
  const releaseUrl = `${remoteInfo.webUrl}/releases/tag/${tag}`;
  const assetName = `chapter-reader-${targetVersion}.vsix`;
  const today = new Date().toISOString().slice(0, 10);

  run('npm', ['version', '--no-git-tag-version', targetVersion]);
  run('npm', ['run', 'compile']);
  run('npm', ['test']);
  run('npx', ['@vscode/vsce', 'package', '--out', assetName]);

  appendWorklogEntry({
    date: today,
    keep: args.keep,
    manualQa: args.manualQa,
    releaseUrl,
    summary: args.summary.trim(),
    tag,
    version: targetVersion
  });

  run('git', ['add', '-A']);
  run('git', ['commit', '-m', `release: ${tag} - ${args.summary.trim()}`]);

  const commitHash = run('git', ['rev-parse', 'HEAD'], { capture: true }).trim();
  run('git', ['tag', tag]);
  run('git', ['push', 'origin', 'main', tag]);

  const releaseNotes = [
    args.summary.trim(),
    '',
    `Tag: ${tag}`,
    `Commit: ${commitHash}`,
    `Manual QA: ${args.manualQa ? 'required' : 'not required'}`
  ].join('\n');

  run('gh', ['release', 'create', tag, assetName, '--title', releaseTitle, '--notes', releaseNotes]);
  pruneReleases(remoteInfo.slug, args.retention);

  console.log(`Release complete: ${tag}`);
  console.log(`Asset: ${assetName}`);
  console.log(`URL: ${releaseUrl}`);
  if (args.manualQa) {
    console.log('');
    console.log(renderManualQaChecklist({
      releaseUrl,
      summary: args.summary.trim(),
      tag,
      version: targetVersion
    }));
  }
}

main();

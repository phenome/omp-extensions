#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const extensionPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(ROOT, 'extensions', 'ponytail-caveman.js');

if (!fs.existsSync(extensionPath)) {
  throw new Error(`Missing extension: ${extensionPath}`);
}

function readSkill(name) {
  const skillPath = path.join(os.homedir(), '.agents', 'skills', name, 'SKILL.md');
  if (!fs.existsSync(skillPath)) throw new Error(`Missing skill: ${skillPath}`);
  return fs.readFileSync(skillPath, 'utf8');
}

for (const name of ['ponytail-review', 'ponytail-audit', 'ponytail-debt', 'ponytail-help']) {
  readSkill(name);
}

const ponytailSkill = readSkill('ponytail');
const cavemanSkill = readSkill('caveman');
const ponytailSentinel = ponytailSkill.includes('The ladder') ? 'The ladder' : 'Does this need to exist';
const cavemanSentinel = cavemanSkill.includes('Inline obj prop') ? 'Inline obj prop' : 'Drop:';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ponytail-caveman-smoke-'));
const agentDir = path.join(tmpRoot, 'agent');
const repoDir = path.join(tmpRoot, 'repo');
const subdir = path.join(repoDir, 'subdir');
const globalConfigPath = path.join(agentDir, 'ponytail-caveman.json');
const repoConfigPath = path.join(repoDir, '.omp', 'ponytail-caveman.json');

function writeConfig(filePath, config) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(config, null, 2)}\n`);
}

writeConfig(globalConfigPath, {
  ponytail: { defaultMode: 'lite' },
  caveman: { enabled: false },
});
writeConfig(repoConfigPath, {
  ponytail: { defaultMode: 'ultra' },
  caveman: { enabled: true },
});
fs.mkdirSync(subdir, { recursive: true });

try {
  const mod = await import(pathToFileURL(extensionPath).href);
  const { resolveDefaultConfig } = mod;
  const extension = mod.default;

  assert.equal(typeof extension, 'function');
  assert.equal(typeof resolveDefaultConfig, 'function');

  let cfg = resolveDefaultConfig({ cwd: tmpRoot, agentDir, env: {} });
  assert.equal(cfg.ponytailDefaultMode, 'lite');
  assert.equal(cfg.cavemanEnabled, false);
  assert.equal(cfg.sources.includes(globalConfigPath), true);

  cfg = resolveDefaultConfig({ cwd: subdir, agentDir, env: {} });
  assert.equal(cfg.ponytailDefaultMode, 'ultra');
  assert.equal(cfg.cavemanEnabled, true);
  assert.equal(cfg.sources.includes(globalConfigPath), true);
  assert.equal(cfg.sources.includes(repoConfigPath), true);

  cfg = resolveDefaultConfig({
    cwd: subdir,
    agentDir,
    env: {
      PONYTAIL_DEFAULT_MODE: 'off',
      CAVEMAN_DEFAULT_ENABLED: 'false',
    },
  });
  assert.equal(cfg.ponytailDefaultMode, 'off');
  assert.equal(cfg.cavemanEnabled, false);
  assert.equal(cfg.sources.includes('env:PONYTAIL_DEFAULT_MODE'), true);
  assert.equal(cfg.sources.includes('env:CAVEMAN_DEFAULT_ENABLED'), true);

  assert.deepEqual(mod.parseCavemanCommand('on'), { type: 'set-enabled', enabled: true });
  assert.deepEqual(mod.parseCavemanCommand('off'), { type: 'set-enabled', enabled: false });
  assert.deepEqual(mod.parsePonytailCommand('off', 'full'), { type: 'set-mode', mode: 'off' });
  assert.match(mod.getCavemanInstructions('ultra'), /CAVEMAN MODE ACTIVE — level: ultra/);
  assert.equal(mod.getCavemanInstructions('ultra').includes(cavemanSentinel), true);
  assert.match(mod.getPonytailInstructions('full'), /PONYTAIL MODE ACTIVE — level: full/);
  assert.equal(mod.getPonytailInstructions('full').includes(ponytailSentinel), true);
  assert.doesNotMatch(mod.getCavemanInstructions('ultra'), /stop caveman|normal mode/i);
  assert.doesNotMatch(mod.getPonytailInstructions('full'), /stop ponytail|normal mode/i);

  const events = new Map();
  const commands = new Map();
  const appended = [];
  extension({
    on: (name, handler) => events.set(name, handler),
    registerCommand: (name, command) => commands.set(name, command),
    appendEntry: (customType, data) => appended.push({ customType, data }),
  });

  const ctx = {
    cwd: subdir,
    ui: { notify: () => {} },
    sessionManager: { getEntries: () => [] },
  };
  await events.get('session_start')({}, ctx);
  let injected = await events.get('before_agent_start')({}, ctx);
  assert.equal(injected.message.customType, 'ponytail-caveman-instructions');
  assert.match(injected.message.content, /CAVEMAN MODE ACTIVE — level: ultra/);
  assert.match(injected.message.content, /PONYTAIL MODE ACTIVE — level: ultra/);

  await commands.get('caveman').handler('off', ctx);
  injected = await events.get('before_agent_start')({}, ctx);
  assert.doesNotMatch(injected.message.content, /CAVEMAN MODE ACTIVE/);
  assert.match(injected.message.content, /PONYTAIL MODE ACTIVE — level: ultra/);

  await commands.get('ponytail').handler('off', ctx);
  injected = await events.get('before_agent_start')({}, ctx);
  assert.equal(injected, undefined);

  await commands.get('caveman').handler('on', ctx);
  injected = await events.get('before_agent_start')({}, ctx);
  assert.match(injected.message.content, /CAVEMAN MODE ACTIVE — level: ultra/);
  assert.doesNotMatch(injected.message.content, /PONYTAIL MODE ACTIVE/);

  console.log('ponytail-caveman smoke test ok');
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}

#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SMOKE_TEST = path.join(ROOT, 'scripts', 'smoke-test-ponytail-caveman.mjs');
const IS_WINDOWS = process.platform === 'win32';

function canRun(command) {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore', shell: IS_WINDOWS });
  return result.status === 0;
}

function skillsRunner() {
  if (canRun('bunx')) return { command: 'bunx', prefix: ['skills'], shell: IS_WINDOWS };
  if (canRun('npx')) return { command: 'npx', prefix: ['-y', 'skills'], shell: IS_WINDOWS };
  throw new Error('Need bunx or npx on PATH to install skills.');
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: Boolean(options.shell) });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit ${result.status}`);
  }
}

const runner = skillsRunner();
const skills = (...args) => run(runner.command, [...runner.prefix, ...args], { shell: runner.shell });

skills('add', 'DietrichGebert/ponytail', '-g', '--skill', '*', '-y');
skills('add', 'https://github.com/juliusbrussee/caveman', '-g', '--skill', 'caveman', '-y');

run(process.execPath, [SMOKE_TEST]);

console.log('Detached skills installed. ponytail-caveman smoke test passed.');

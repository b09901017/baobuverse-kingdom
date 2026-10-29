#!/usr/bin/env node
// 讀 Playwright 的 JSON 報表，印每個檔花了幾秒（大到小）、總時間、過／紅幾個。
//
//   node durations.mjs .artifacts/results.json        # 路徑照專案 playwright.config 的 json reporter
//   node durations.mjs results.json --tests            # 改印每一個測試（最慢的 30 個）
//
// 專案還沒有 json reporter 的話，先在 config 的 reporter 加 ['json', { outputFile: '…' }]，
// 或這一次跑 `npx playwright test --reporter=json > results.json`。

import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) { console.error('用法：node durations.mjs <results.json> [--tests]'); process.exit(2); }
const r = JSON.parse(readFileSync(file, 'utf8'));
const perTest = process.argv.includes('--tests');

const byFile = new Map();
const tests = [];
const count = { passed: 0, failed: 0, flaky: 0, skipped: 0 };

function walk(suite, f) {
  f = suite.file || f;
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) {
      const ms = (t.results ?? []).reduce((s, x) => s + (x.duration ?? 0), 0);
      byFile.set(f, (byFile.get(f) ?? 0) + ms);
      tests.push([ms, `${f} › ${spec.title}`, t.status]);
      if (t.status === 'expected') count.passed++;
      else if (t.status === 'unexpected') count.failed++;
      else if (t.status === 'flaky') count.flaky++;
      else count.skipped++;
    }
  }
  for (const c of suite.suites ?? []) walk(c, f);
}
for (const s of r.suites ?? []) walk(s);

const sec = (ms) => (ms / 1000).toFixed(1).padStart(7) + 's';
if (perTest) {
  for (const [ms, name, st] of tests.sort((a, b) => b[0] - a[0]).slice(0, 30)) console.log(`${sec(ms)}  ${st === 'expected' ? '  ' : '✘ '}${name}`);
} else {
  for (const [f, ms] of [...byFile].sort((a, b) => b[1] - a[1])) console.log(`${sec(ms)}  ${f}`);
}
const wall = r.stats?.duration;
console.log(`\n總時間 ${wall ? (wall / 60000).toFixed(1) + ' 分鐘' : '（報表沒有 stats.duration）'}；` +
  `過 ${count.passed}、紅 ${count.failed}、重試才過 ${count.flaky}、跳過 ${count.skipped}；` +
  `每個測試加起來 ${(tests.reduce((s, t) => s + t[0], 0) / 60000).toFixed(1)} 分鐘`);

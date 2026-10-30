// 部署國庫到 https://baobu-kingdom.web.app（issue 06）：pnpm run deploy（在根目錄）。先看一次目標：pnpm run deploy --dry-run
// 1. 檢查目標（deploy-plan.ts）：.firebaserc、firebase.json 的 site 都要是 baobu-kingdom，出現 baobu-app 就停
// 2. pnpm verify（型別檢查、測試、建置）
// 3. firebase deploy --project baobu-kingdom --only hosting,firestore:rules,firestore:indexes

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { planDeploy } from "./deploy-plan.ts";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const readJson = (name) => JSON.parse(readFileSync(join(root, name), "utf8"));

const plan = planDeploy({
  firebaserc: readJson(".firebaserc"),
  firebaseJson: readJson("firebase.json"),
  args: process.argv.slice(2),
});
if (!plan.ok) {
  console.error("不部署：");
  for (const problem of plan.problems) console.error(`- ${problem}`);
  process.exit(1);
}

// Windows 上 pnpm、firebase 是 .cmd，要經過 shell；參數都是寫死的（planDeploy 只收 --dry-run），沒有空白
const run = (command, args, cwd) => {
  const line = [command, ...args].join(" ");
  console.log(`\n> ${line}`);
  const result = spawnSync(line, { cwd, stdio: "inherit", shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

run("pnpm", ["run", "verify"], root);
run("firebase", plan.firebaseArgs, fileURLToPath(new URL("..", import.meta.url)));

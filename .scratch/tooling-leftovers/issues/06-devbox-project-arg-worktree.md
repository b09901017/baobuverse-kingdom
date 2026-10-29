# 06 devbox：`--project` 是 worktree 時看主資料夾

Status: done
Blocked by: 05（`mainDir` 那一套先整理好）
動工前先讀：`.scratch/legacy-to-home/HANDOFF.md`「中途發現」段 4 第 1 條；客廳 `tools/devbox.mjs` 的 `checkProjectArg`、`tools/autosync.mjs` 的 `mainDir`

## 使用者要的

> 下一輪，候選清單就一起做吧，全部完成

## 為什麼會這樣

在 worktree 開的對話，儀表板帶給 devbox 的 `--project` 是 worktree 的路徑；`checkProjectArg` 拿它跟 `devbox.json` 的 `home` 比，對不到 → 多印一行「⚠️ <worktree 名> 還沒加進 VM 的清單」（處理的照樣是清單上每一個專案）。

## 判準

- `--project <某專案的 worktree>` 會不會印「還沒加進 VM 的清單」？（要：不印，認成那個專案）
- `--project <真的不在清單上的資料夾>` 會不會不印了？（要：照舊印）
- 認主資料夾的方法用 05 從 autosync export 的 `mainDir`，不另寫一份
- 紅燈先；既有測試一條都不改
- 不在這支：儀表板的 `DashVm.project` 也是 worktree 名（`register.tsx:1890`，「在 X 按的」會寫 worktree 名）→ 07 跟 J7 一起看

## 做完時留下的（段 3，客廳 `52da7a7`）

- `devbox.mjs` 開頭 `import { mainDir } from './autosync.mjs'`（05 讓它可以被 import），`checkProjectArg` 拿 `mainDir(--project)` 跟清單的 `home` 比。沒另寫一份認法。
  `mainDir` 對不是 git repo、不存在的資料夾回原本的路徑，所以「真的不在清單上」照舊印；專案底下的子資料夾現在也認成那個專案（git 的 common dir 一樣）。
- 測試：devbox 新 2 條（15 → 17）：清單上專案的 worktree → 不印（**紅 → 綠**）；不在清單上的 repo 的 worktree → 照舊印（守門：不是「是 worktree 就算」）。既有的「`--project` 不在清單上」（不存在的資料夾）照過。devbox-mods 30 照過（假客廳本來就兩支一起複製）。
- 部署上的連帶：`devbox.mjs` 現在要跟同一個資料夾的 `autosync.mjs` 一起才跑得動（家裡、VM 的客廳都是整個 `tools/`，沒影響）。
- 不在這支：儀表板的 `DashVm.project`（「在 X 按的」寫 worktree 名）留給 07。

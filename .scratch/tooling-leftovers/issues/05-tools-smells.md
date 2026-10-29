# 05 客廳 tools 異味整理（J2、J3、J5、J6、J8）

Status: todo
Blocked by: 03、04（同幾個檔，它們先）
動工前先讀：`.scratch/legacy-to-home/HANDOFF.md`「判斷題」J2、J3、J5、J6、J8；這份 HANDOFF「過目抓到的」05；spec「允許改的既有測試」；
客廳 `tools/autosync.mjs`（旗標 `:34-37,50,259,338,435,451`、`mainDir` `:227-235`、最後的 `process.exit`）、`tools/devbox.mjs`（`--no-home` `:154,193,424`；`'ok'`／`'none'`／`'bad'` `:340,386-392,402`）、
`tools/*.test.mjs`（四支都把 `autosync.mjs`／`devbox.mjs` 複製進假客廳：`autosync.test.mjs:83`、`devbox.test.mjs:99-100`、`devbox-mods.test.mjs:85-90`、`mods.test.mjs:70,206`）、limit-guard `hooks/register.ts` 的 `worktreeOf`（`:133-141`）、客廳 `README.md:127`

## 使用者要的

> 下一輪，候選清單就一起做吧，全部完成

## 要做的

| # | 改什麼 |
|---|---|
| J3 | 先做：`autosync.mjs` 的模式旗標開頭算一次 mode；頂層包進「直接執行才跑」的判斷，讓它**可以被 import**（現在一 import 就跑、最後 `process.exit`），export `mainDir` 給 06 用。不另開模組（四支既有測試只複製這兩支腳本） |
| J2 | `--no-home`（意思是「不做 mods」，又撞到 devbox 的「回家」）改名 `--no-mods`。呼叫端：`autosync.mjs:13`（註解）、`:338`、`devbox.mjs:154`、`:193`（經 ssh 在 **VM 上的客廳** 跑）、`:424`、客廳 `README.md:127`。`vm/` 底下的 unit 與腳本沒有用它。
  新的 autosync 兩個名字都認；`:193` 這一輪**同時帶 `--no-home --no-mods`**（VM 的客廳可能還沒 pull），下一輪再拿掉舊名字 |
| J6 | `vm-state.json` 的 `'ok'`／`'none'`／`'bad'` → 一處定義的常數（檔案格式不變，VM 上現有的舊檔照樣讀得懂） |
| J5 | `mainDir`（node、git CLI）與 limit-guard `worktreeOf`（mod 引擎、讀 `.git` 檔）不能互相 import → 一份共用案例 JSON（例如放 limit-guard `tests/fixtures/`），tools 的 node 測試與 limit-guard 測試各讀同一份、比同一個答案。
  案例要有相對路徑的 `gitdir: ../../.git/worktrees/x`（git 2.48 以後 `worktree.useRelativePaths`）：`worktreeOf` 現在會算出 `..`，開場寫到 `handoffs/..`。分歧照 `mainDir` 的答案修 `worktreeOf`，紅燈先 |
| J8 | `mods.test.mjs:27-32`、`devbox-mods.test.mjs:34-39` 各一份的 `git`／`write`／`read` → `tools/helpers-for-tests.mjs`（**不要**叫 `test-*.mjs`，會被 `node --test` 當成測試檔） |

## 判準

- J3、J6、J8 不改行為：既有測試（autosync 19、mods 13、devbox 14、devbox-mods 22、limit-guard 52）的**斷言**一條都不改就全過。J8 與「讓 autosync 可以被 import」要改的只有測試檔的 import／setup 行（spec「允許改的既有測試」已列，主控 10/29 同意）
- J2：家裡新版 devbox 對 VM 上舊版 autosync 送參數，會不會多跑一次 mods 備份？（要：不會，因為兩個名字都帶）。寫進 spec「行為會變的」
- J5：同一份案例兩邊算出來一樣（含相對 gitdir）；limit-guard 的改動照 mods 規矩（tsc、validate、複製進客廳）

# 05 客廳 tools 異味整理（J2、J3、J5、J6、J8）

Status: done
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

## 做完時留下的（段 3，客廳 `baebee3`）

- **J3**：`autosync.mjs` 開頭算一次 `mode`（`restore`、`check-mods`、`restore-mods`、`dry-run`、`strict`，照這個順序取第一個；都沒有就看 `--now`／`--worker` 是 `now`，不然是 `background`），`dryRun`、`strict` 從它來。
  原本散在頂層的四段（開背景程序、`--restore`、`--restore-mods`／`--check-mods`、兩半同步）收成 `restoreNow`、`modsNow`、`syncNow`、`main`，回傳 exit code，最後 `main()` 一處 `process.exit`。
  直接執行才跑：`realpathSync(process.argv[1]) === realpathSync(SELF)`（不用 `import.meta.main`：Node 24.2 才有，VM 上的 node 版本沒確認）。`export { mainDir }`。
  四支既有測試的 setup 行**不用改**（spec「允許改的既有測試」J3 那列沒用到）。跟 issue 不同的一點：同時帶 `--dry-run --strict` 現在只當試跑（spec「行為會變的」05）。
- **J2**：`--no-mods`，`backupMods` 兩個名字都認。家裡的 `pushLocal`、`pullLocal` 與 presync 改帶 `--no-mods`；`vmState`（經 ssh 跑 VM 上的客廳）同時帶 `--no-home --no-mods`。客廳 `README.md` 的手動用法、`autosync.mjs` 開頭的說明一起改。下一輪拿掉 `--no-home`（`vmState` 那行與 `backupMods`）。
  測試：autosync「`--no-mods` 與舊名字 `--no-home`：都不做 mods 那一半」（紅：`--no-mods` 不認得照做 mods）；devbox「回家（VM 開著）：叫 VM 上的 autosync 推 .local 時 `--no-home` 與 `--no-mods` 都帶」（假的 VM 上的 autosync 記下參數；VM 上留一個沒 commit 的檔，讓回家在關 VM 之前停）（紅）。
- **J6**：`devbox.mjs` 開頭 `MODS_STATE`（`pushed: 'ok'`、`noHomeRepo: 'none'`、`notPushed: 'bad'`）與 `NO_UPSTREAM = 'none'`（`ahead`、`localahead` 還沒推過，`vmState` 的 shell 也用它）。寫進 `vm-state.json` 的字不變。
- **J8**：`tools/helpers-for-tests.mjs`：`gitWith(env)`、`write`、`read`、`midRebase`、`releaseLater`、`hook`。`mods.test.mjs`、`devbox-mods.test.mjs` 的 `git`／`write`／`read` 與段 2 在 `autosync.test.mjs`、`devbox-mods.test.mjs` 檔尾抄的 `releaseLater`／`midRebase`／`hook` 改成 import（只動 import 與那幾行定義，斷言沒改；`git` 吃各自的 `ENV`，所以是 `const git = gitWith(ENV)`）。
  `autosync.test.mjs`、`devbox.test.mjs` 開頭也有一份 `git`／`write`、兩支 devbox 測試各有一份找 bash 的 `BASH`：spec 只准 mods 與 devbox-mods 兩支，沒動。
- **J5**：共用案例是 **`.ts` 不是 JSON**：mod 測試引擎不載入 `.json`（「is not named like code and was not loaded」），Node 24 可以直接 import 只有型別標註的 `.ts`。放 `mods/limit-guard/tests/fixtures/worktree-cases.ts`，六種：主資料夾、`.claude/worktrees` 絕對 gitdir、`.claude/worktrees` 相對 gitdir、主資料夾旁邊的 `wt-*`（相對）、submodule、不是 git repo。
  客廳 `autosync.test.mjs` 用 git 真的做出每一種（`worktree add`、`--relative-paths`、`submodule add`），**先確認 `.git` 檔真的跟案例寫的一樣**，再比 `mainDir` 的主資料夾名；limit-guard `worktree-handoff.test.ts` 拿同一份 `.git` 檔當假的檔，比系統提示裡的開場資料夾。
  紅的只有相對 gitdir 在 `.claude/worktrees` 那條（`..`；`wt-*` 的相對路徑碰巧對，因為最後一段剛好是主資料夾名）。`worktreeOf` 改成相對路徑先接在 worktree 後面、把 `..` 消掉再取名字。limit-guard 52 → 58。
- **段 2 中途發現第 2 條**（主控決定 05 順手修）：`pullLocal` 的 `--restore` 改用 `autosync()`＋`said(r)`，失敗時停在「家裡電腦的 X/.local 接好了，記憶與開場沒接回來：接回來的時候出錯了：<原因>」。紅燈：家裡記憶資料夾的位置被一個檔佔著（以前印「出錯了：Command failed: …」）。
- 測試（一支一支跑）：autosync 31 → 33、devbox 14 → 15、devbox-mods 29 → 30、mods 13、limit-guard 52 → 58；tsc 0 錯、validate 跟改之前一樣（只有沒寫 author 的警告）。

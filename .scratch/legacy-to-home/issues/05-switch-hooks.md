# 05 換手：全域 hook 改叫客廳的同步、開場一律放主資料夾的子資料夾、儀表板一律叫客廳的 devbox

Status: todo
Type: task
Blocked by: 04

## 動工前先讀

- [`../spec.md`](../spec.md)「換手的順序」（這一支是第 3 步）、「上一個專案一律不能壞」、「允許改的既有測試」
- `~/.claude/settings.json` 的 `hooks`（SessionStart／SessionEnd 現在叫上一個專案的 `.local/tools/autosync.mjs`）；它的正本在客廳 `settings/settings.json`（`:12`、`:23`）與 `settings/README.md:8`
- 這個 repo 的 `.claude/settings.json`（專案 hook 叫 `.claude/scripts/autosync.mjs`）與 `.claude/scripts/autosync.mjs`
- 客廳 `tools/autosync.mjs`（`syncProject`、`memoryDir`、`handoffsDir` `:179` 用的是工作目錄的資料夾名、`withLock`、`backupMods`）、`README.md`「新專案怎麼接」「自動同步」
- `~/.claude/mods/limit-guard/hooks/register.ts`：`FLAT_PROJECTS` 與開場資料夾怎麼算（`:159-180`；現在只有判斷「平放」時才看 worktree 的主資料夾）、
  開新對話時從哪裡讀開場（`:195-225`：第一層加上自己的子資料夾、用資料夾名比對、只自動放 3 天內還沒用過的）；
  `tests/handoff-dir.test.ts`、`tests/worktree-handoff.test.ts`
- `~/.claude/mods/dash/hooks/register.tsx`：雲端分頁叫哪一支 devbox（`:1806-1830`，`LEGACY_DIR`）；`tests/vm-projects.test.tsx`、`tests/vm.test.tsx`
- 上一個專案 `.local/tools/sync-claude.mjs`（唯讀）：它鏡像的是 `handoffs/` **第一層**，而且那個資料夾一定在（`:28`、`:77-79`）
- `.scratch/claude-home-workflow/issues/11-global-hook-router.md`（為什麼上一輪不分流）

## 使用者要的

> 我只要更新客廳的東西，我的所有專案都可以更上

第 7 題：上一個專案的舊工具不改、不刪，只是不再叫。

## 為什麼會這樣

- 全域 hook 叫上一個專案的 `autosync.mjs`：不管在哪個資料夾開對話，都同步上一個專案的 `.local`。它沒有鎖，
  好幾個對話同時開關就撞 `index.lock`（它的 `tools/autosync.log` 10/28 23:57、10/29 02:06 都有）。
- 這個專案另外用專案 hook 叫客廳的同步；正本在這個 repo（`.claude/scripts/autosync.mjs`），段 6 審查列為硬違規（hook 腳本屬客廳）。
- limit-guard 把上一個專案的開場平放在 `handoffs/`（`FLAT_PROJECTS`），其他專案放 `handoffs/<資料夾名>/`；其他專案的 worktree 放 `handoffs/<worktree 名>/`，
  而客廳的同步看的是工作目錄的資料夾名、worktree 底下也沒有 `.local` —— worktree 的開場現在根本不會進 `.local`。
- **舊的 sync-claude 還會被叫到**（儀表板在上一個專案的資料夾叫舊的 devbox、VM 上的全域 hook、VM 的 `devbox-presync`）：
  它鏡像 `handoffs/` 第一層到 `.local/claude-handoffs/`。平放的開場如果被「搬走」，第一層是 0 份，它就把 `.local/claude-handoffs/` 刪光並推上去，之後回家再鏡像回來，家裡那份也沒了。

## 做法（同一段一起上，照這個順序，中間不要停在一半）

1. **先複製、不搬**：`~/.claude/mods-data/handoffs/` 底下平放的 `*.json`（都是上一個專案的）**複製**進 `handoffs/baobao-wellness-clinic-scheduler/`。
   平放的那幾份**留著**，等 08 把 VM 那一半換完、06 再刪 —— 這樣舊的 sync-claude 就算被叫到，也不會鏡像出一個空的資料夾。
2. **儀表板**：雲端分頁一律叫客廳的 `devbox.mjs`（帶 `--project`），拿掉 `LEGACY_DIR` 那一段（`register.tsx:1806-1830`；原本排在 06，因為它會叫到舊的 sync-claude，提前到這裡）。
3. **全域 hook** 改叫客廳的 `tools/autosync.mjs --project "${CLAUDE_PROJECT_DIR}"`（`~/.claude/settings.json` 與客廳 `settings/settings.json` 一起改、`settings/README.md` 一起更新）。
   在任何資料夾都會做「mods 備份進客廳」；有 `.local/` 的專案再同步那個專案的 `.local`（04 改成整個 `.local`）。
4. 這個 repo 的專案 hook 與 `.claude/scripts/autosync.mjs` 拿掉（全域 hook 已經做了；兩個都叫會跑兩次）。客廳 `README.md`「新專案怎麼接」第 4 步（從這個專案複製 hook 腳本）改掉。
5. **limit-guard**（存檔就生效，所以放在 hook 換完之後）：拿掉 `FLAT_PROJECTS`；每個專案一律 `handoffs/<主資料夾名，小寫>/` —— **worktree 一律用主資料夾名**（現在只有平放時才看主資料夾，要改成都看）。
   客廳 `autosync.mjs` 的 `handoffsDir` 也照主資料夾名算（在 worktree 開的對話，要同步到主資料夾的 `.local`，或確定不需要並寫理由）。
6. 上一個專案的記憶資料夾：客廳 `memoryDir` 要找得到它實際用的那一個（大小寫 `C--`／`c--`、`.claude` 或 `.claude-account*`），跟它的 `sync-claude.mjs` 找到的是同一個。
7. 換之前，在暫存資料夾的複本上對上一個專案跑一次客廳的同步，確認會 commit 的檔跟它自己的同步一樣（mods 除外）。`--dry-run` 不是唯讀，不要在真的 `.local` 上試。

## 判準

- 換手之後，在上一個專案的資料夾開一個對話又關掉：它的 `.local` 會不會有一個 commit，內容是記憶、開場、以及 `references/` 等它原本就會推的變動（沒有 `claude-mods/`）？（看 `.local` 的 `git log --stat`）
- 同時開關兩個對話：客廳的 `autosync.log` 有「別的同步正在跑，這次跳過」、上一個專案的 `tools/autosync.log` 不再有新的行？
- 舊的 sync-claude 在換手之後被叫一次（例如手動跑 `node .local/tools/sync-claude.mjs` 在暫存資料夾的複本上）：`.local/claude-handoffs/` 會不會被清空？（不應該：平放的還在）
- 換手前存的上一個專案開場，開新對話還會不會自動放進輸入框？（10/19～21 那 8 份已經用過、過了 3 天，本來就不會放；用一份新的測）
- 在這個專案的資料夾開對話：會不會同步兩次？在 worktree 開的對話，開場存到哪裡、有沒有進 `.local`？
- 雲端 session（沒有客廳、不讀 `~/.claude`）：會不會出錯？
- 上一個專案在 VS Code 開對話：儀表板「雲端」分頁按出門，叫的是客廳的 `devbox.mjs`、帶 `--project`？

## 規矩

改 `~/.claude/settings.json` 被 auto mode 擋就停，把使用者要做的寫成一步一步放進 HANDOFF「要使用者做的」，不要繞。
**做這一段之前主控會問使用者：上一個專案現在有沒有開著的對話**（有的話它的 hook 還是舊的）。這一段做完到 08 做完之間不要按出門／回家。
允許改的既有測試只有 spec「允許改的既有測試」列的；改 mods 的規矩照 HANDOFF「每一段共同的規矩」。
判準 1、2、5 要真的開關對話來驗：請主控開一個短的對話（或請使用者開），看 `.local` 的 `git log --stat` 與兩份 log。

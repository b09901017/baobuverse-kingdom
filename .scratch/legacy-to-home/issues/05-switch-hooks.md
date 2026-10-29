# 05 換手：全域 hook 改叫客廳的同步、開場一律放主資料夾的子資料夾、儀表板一律叫客廳的 devbox

Status: done
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

## 做完時留下的（2026-10-29，段 4）

上一個專案在換手時沒有開著的對話（使用者 2026-10-29 確認）。照做法的順序做，中間沒有停在一半。

### 做成什麼樣子

| # | 做法 | 實際做的 |
|---|---|---|
| 1 | 平放的開場先複製 | `~/.claude/mods-data/handoffs/` 第一層 8 份（10/19～21）`cp -p` 進 `handoffs/baobao-wellness-clinic-scheduler/`（保留時間），逐檔 `cmp` 相同；第一層的留著（06 再刪） |
| 2 | 儀表板一律叫客廳的 devbox | `dash/hooks/register.tsx`：`LEGACY_DIR` 與「有沒有 `.claude/project.json`」的判斷拿掉。客廳的 `tools/devbox.mjs` 在就叫它、帶 `--project <資料夾>`（讀不到資料夾就不帶）；客廳不在就不畫按鈕、不叫任何一支，寫「這一頁只在家裡電腦上用；這台找不到客廳的 devbox.mjs（<家目錄>/claude-home/tools/devbox.mjs）：先把客廳 clone 到 <家目錄>/claude-home 再打開這一頁。」（主控照 A）。在上一個專案的資料夾也會出現「在 baobao-wellness-clinic-scheduler 按的：VM 上的每一個專案都會一起處理」那一行 |
| 3 | 全域 hook | `~/.claude/settings.json` 與客廳 `settings/settings.json` 的 `SessionStart`／`SessionEnd` 改成 exec 形式：`"command": "node"`、`"args": ["C:/Users/DELL/claude-home/tools/autosync.mjs", "--project", "${CLAUDE_PROJECT_DIR}"]`（跟這個 repo 原本的專案 hook 同一種寫法，Windows 沒有 bash 也跑得起來）。改前的備份在段 4 的 scratchpad。沒被 auto mode 擋。客廳 `settings/README.md` 那一列重寫 |
| 4 | 這個 repo 的專案 hook | `.claude/settings.json` 的 `hooks` 整段拿掉（只剩 `skillOverrides`）、`.claude/scripts/autosync.mjs` 刪掉。客廳 `README.md`「新專案怎麼接」第 4 步改成「不用另外接、專案不要再加自己的同步 hook」，「自動同步」開頭改寫 |
| 5 | limit-guard | `FLAT_PROJECTS` 拿掉；開場一律 `handoffs/<主資料夾名，小寫>/`，worktree 一律看主資料夾（`handoffDirFor`）。讀的時候：自己的子資料夾全部算（不比 `root`：worktree 存的、主資料夾存的互相接得到）；第一層照舊讀但要比 `root`，**跟子資料夾同名的跳過**（上一個專案換手前平放的那 8 份只認子資料夾的複本，用過只標子資料夾那份） |
| 5b | 客廳 `autosync.mjs` 照主資料夾算 | 新 `mainDir`：`git rev-parse --git-common-dir` 是 `<某處>/.git` 就用那個主資料夾（不是 git repo、submodule 照原本的資料夾）。`syncProject` 的 `.local`、記憶、開場都照主資料夾 |
| 6 | 上一個專案的記憶資料夾 | 對過：它的 `sync-claude.mjs` 找 `[C--, c--] × [.claude, .claude-account2]` 第一個有 `MEMORY.md` 的 → `~/.claude/projects/c--…/memory`。客廳 `memoryDir` 找 `[CLAUDE_CONFIG_DIR, .claude, .claude-account1, .claude-account2]` × `[C--, c--]`：`.claude-account1` 那一格是空資料夾（沒有 `MEMORY.md`）跳過、`.claude-account2/projects` 是連到 `.claude/projects` 的 junction，所以不管用哪個帳號開都找到同一個。程式不用改 |
| 7 | 暫存複本上比 | 見下面「判準」第 1 列 |

### 跟 issue 寫的不同的地方

1. **limit-guard 讀第一層**：issue 說「一律放主資料夾的子資料夾」，原本打算連讀都不讀第一層，但 `tests/next.test.ts`（不在允許清單）測的是「第一層的開場自動放進輸入框」（分專案之前存的）。改成第一層照舊讀、比 `root`，只跳過跟子資料夾同名的 —— 既有測試一字不改，上一個專案的 8 份也不會出現兩份。
2. **子資料夾裡的開場不比 `root`**：worktree 存的開場 `root` 寫 worktree 的路徑，資料夾名字跟主資料夾不同；比 `root` 的話主資料夾的新對話接不到。子資料夾已經是「這個專案的」，所以不比。
3. **客廳 `handoffsDir` 沒改**：改的是呼叫它的 `syncProject`（先 `mainDir`），`handoffsDir` 本身照舊用傳進來的資料夾名。
4. 改到的既有測試（都在 spec「允許改的既有測試」裡）：
   - limit-guard `handoff-dir.test.ts`「上一個專案：系統提示…」（第一層 → 子資料夾）、「上一個專案：…放進輸入框」（加一份第一層同名的，確認只認子資料夾那份、只標它用過）；
     `worktree-handoff.test.ts` 三條 worktree 的系統提示、「上一個專案的 worktree：…放進輸入框」、「其他專案的 worktree」（`feat-x/` → `baobuverse-kingdom/`）。兩支開頭的說明也跟著改。
   - dash `vm-projects.test.tsx` 前兩條（上一個專案的資料夾、認不出的資料夾 → 客廳的、帶 `--project`）、`vm.test.tsx:7`（`isDevbox` 認客廳那一支）。
   - dash `vm-projects.test.tsx:98-106`「新專案但客廳還沒 clone → 照舊叫上一個專案那一支」：spec 原本沒列，**主控 2026-10-29 照 A**（理由：留退路會讓舊的 sync-claude 又被叫到；拿掉是「不做」不是少問），
     改成「客廳還沒 clone → 不畫出門／回家、不叫任何一支，畫面寫『這台找不到客廳的 devbox.mjs（<路徑>）：先把客廳 clone 到 <路徑> 再打開這一頁』」，spec 補上這一行。
     主控的條件都做了：字寫清楚怎麼辦（路徑照這台的家目錄算）；grep 整個 dash：VS Code 與桌面 app 載的是同一份 `~/.claude/mods/dash`，拿掉之後沒有別的地方寫死上一個專案的 devbox.mjs 或 sync-claude（只剩一行說明為什麼拿掉）；這個畫面不截圖，測試斷言那段字。
5. 新測試：limit-guard 1 條（worktree 存的開場在主資料夾接得到）；客廳 `autosync.test.mjs` 2 條（worktree 的對話 commit 進主資料夾的 `.local`、開場用主資料夾名；不是 git repo 的資料夾只做 mods）。新測試與改過的期待值在改之前的程式上是紅的（limit-guard 8 紅、dash 4 紅＋照 A 那條 1 紅、autosync 1 紅；「不是 git repo」那條是守住原本行為的）。

### 每個設定資料夾的 `settings.json`（主控要查的）

| 資料夾 | 誰用 | 原本的 `hooks` | 現在 |
|---|---|---|---|
| `~/.claude` | 桌面 app、沒設 `CLAUDE_CONFIG_DIR` 的終端機 | 舊的同步 | 客廳的（做法 3） |
| `~/.claude-account2` | VS Code（`CLAUDE_CONFIG_DIR`） | **舊的同步**（issue 沒列到） | 客廳的（判準 1 第一次沒過才發現；同一種寫法，改前備份在段 4 scratchpad，沒被擋） |
| `~/.claude-account1` | VS Code 切到另一個帳號時（03 讓它出現在切換清單） | **沒有 `hooks`** | 使用者 2026-10-29 選「補上」；段 4 改的時候被 auto mode 擋了（Self-Modification），**還沒改**，步驟在 HANDOFF「要使用者做的」（段 4 中途發現 4） |

11:06 與 11:10 舊的同步在上一個專案 `.local` 留下兩個 commit（`claude-mods/` 6 個與 3 個檔，都是「改」，**沒有刪檔、沒有動 `claude-handoffs/` 或其他檔**，`references/` 0；`claude-handoffs/` 還是 8 份）。
11:10 那個是同一個 VS Code 對話結束時跑的（`~/.claude-account2` 改好之前）。上一個專案的 `tools/autosync.log` 現在 128 行（重測的基準）。

客廳 `settings/README.md` 補一段「每個設定資料夾各有一份 `settings.json`，`hooks` 要一樣」（`fe4af86`）。

### 判準

| 判準 | 結果 |
|---|---|
| 換手前：暫存複本上客廳的同步會 commit 的檔跟舊的一樣嗎（做法 7） | 一樣：clone 上一個專案的 `.local` 到短路徑（`core.longpaths`、`autocrlf false`、push 網址設成假的、錯誤導到檔案 0 行），記憶放暫存 `CLAUDE_CONFIG_DIR` 的 `projects/<複本代號>/memory`。客廳 `--dry-run --no-home`：0 個檔；舊的 `sync-claude.mjs`：除了 `claude-mods/` 6 個檔以外 0 個（`references/` 兩邊都 0）。確認客廳真的找到記憶：在暫存記憶加一行 → 1 個（`claude-memory/MEMORY.md`）。複本用完刪掉 |
| 舊的 sync-claude 換手後被叫一次：`.local/claude-handoffs/` 會被清空嗎？ | 不會：同一個複本上跑舊的 `sync-claude.mjs`，`claude-handoffs/` 之前 8 份、之後 8 份（第一層的 8 份還在） |
| 在上一個專案的資料夾開對話又關掉：`.local` 有沒有一個 commit（記憶、開場、`references/`，沒有 `claude-mods/`）？ | 第一次（11:06～11:08）**沒過**：上一個專案那個對話是在 **VS Code** 開的，VS Code 讀 `~/.claude-account2/settings.json`，那份還掛著舊的 hook → 舊的同步照跑（它的 `tools/autosync.log` 122 → 126 行，`.local` 多一個 11:06 的 commit，內容是 `claude-mods/` 6 個檔，`references/` 0）。已把那份的 `hooks` 換成客廳的。
**重測（11:16～11:23，使用者開、打 hi、封存）過了**，每個對話從 transcript 認是哪個入口、哪個設定資料夾：
① VS Code 主帳號（`~/.claude-account2`，transcript 在 `~/.claude/projects`，經 junction），上一個專案，11:16:09 開、T＝11:17 封存：客廳 log 11:16、11:17 各一行「`claude-home`：別的同步正在跑，這次跳過」（開始與結束都跑了新的同步），上一個專案 `tools/autosync.log` 還是 128 行、`.local` 沒有新 commit、工作目錄乾淨（記憶與開場沒有變動，所以沒有 commit 是對的；有變動才 commit 的情況在暫存複本上驗過）。
② VS Code 另一個帳號（`~/.claude-account1`，transcript 在那個資料夾自己的 `projects`），上一個專案，11:18～11:19：那份 `settings.json` 還沒有 `hooks`（使用者還沒貼上，HANDOFF「要使用者做的」），所以什麼都沒跑 —— 預期中；128 行沒變、沒有舊的同步。
③ 桌面 app 主帳號（`~/.claude`），T＝11:22：transcript 的 `cwd` 是**這個專案**，不是上一個專案。開的時候（11:21:56）把這個專案的 `.local` 推了一個 commit（`claude-handoffs/` 1 個、`main-session-handoff.md`）；封存之後 11:23:29 寫了基準點（＞T）→ **封存會跑 SessionEnd**。上一個專案 128 行沒變。
上一個專案在桌面 app 開的對話這次沒測到；桌面 app 讀的 `~/.claude/settings.json` 跟 ③ 同一份，在哪個資料夾都是同一段 `hooks` |
| 同時開關兩個對話：客廳 `autosync.log` 有「別的同步正在跑，這次跳過」、上一個專案 `tools/autosync.log` 不再有新的行？ | 客廳那一半過了：11:08 這個專案在桌面 app 連開兩個，客廳 `autosync.log` 有「`claude-home`：別的同步正在跑，這次跳過」，第一個推了這個專案的 `.local`（`e47cb1f`）與客廳（`8d49a61`）。上一個專案 log 多的 4 行是上面那個 VS Code 對話（舊的 hook）跑的。改完 `~/.claude-account2` 之後（重測 ①～③）上一個專案的 log 一行都沒加（128 行），客廳 log 11:16、11:17 又有「這次跳過」 |
| 換手前存的上一個專案開場，開新對話還會自動放進輸入框嗎？ | 那 8 份已經過 3 天，本來就不會自動放；新的（子資料夾）會：`handoff-dir.test.ts`「上一個專案：自己子資料夾的開場放進輸入框…」 |
| 在這個專案的資料夾開對話會同步兩次嗎？worktree 的開場存到哪、有沒有進 `.local`？ | 專案 hook 拿掉，只剩全域一次：11:08 兩個對話，這個專案的 `.local` 只有一個新 commit，客廳 log 沒有「這個專案的 `.local`：別的同步正在跑」（兩套一起跑時有，例如 09:57、09:58）。worktree 的開場存 `handoffs/baobuverse-kingdom/`（`worktree-handoff.test.ts`），客廳同步把它 commit 進主資料夾的 `.local`（`autosync.test.mjs`「在 worktree 開的對話…」） |
| 雲端 session（沒有客廳、不讀 `~/.claude`）會出錯嗎？ | 不會：雲端讀的是 repo 裡的 `.claude/settings.json`，`hooks` 已經拿掉，什麼都不跑（之前是專案 hook 找不到客廳就 exit 0） |
| 上一個專案在 VS Code 開對話：「雲端」分頁按出門叫的是客廳的 `devbox.mjs`、帶 `--project`？ | 是（`vm-projects.test.tsx` 第一條）；畫面上多一行「在 baobao-wellness-clinic-scheduler 按的：…」要截圖看。**這一段沒有真的按**（段 5 之前不按出門／回家） |

驗證（一支一支跑）：limit-guard `claude plugin test` 52（基準 51：既有的照 spec 改 7 條、其他一字不改＋新 1）、dash `claude plugin test` 34（基準 34：既有的照 spec 改 3 條＋主控照 A 的 1 條、其他一字不改）、客廳 `node --test tools/autosync.test.mjs` 16（既有 14 一字不改＋新 2）；
`tsc` 兩支 0 錯、`claude plugin validate` 兩支過（警告只有原本的）。客廳 `mods/` 跟 `~/.claude/mods` 逐檔相同：相同（客廳 `8d49a61` 是自動同步備份的，就是最後的狀態；`--check-mods` 跟 GitHub 上的一樣）。

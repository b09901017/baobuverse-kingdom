# 第 3 階段：上一個專案改用客廳的工具

> 這一輪**不寫 app 的程式碼**。做的是開發環境與工作流程，接著 [`claude-home-workflow`](../claude-home-workflow/spec.md) 的第 1、2 階段。

## 使用者要的（原話）

上一輪（spec 原話）：

> 我希望可以保留上次專案中的工作流程，雖然之可能會再優化，但是我希望這個優化是可以持續跌帶更新的，像是你說的客廳那樣，我只要更新客廳的東西，我的所有專案都可以更上

> 不要影響到上個專案，畢竟那個專案還在進行中還在維護測試

第 3 階段要開始時（2026-10-28，主控 session）：

> 我現在不忙可以解決

儀表板那一輪的中途發現 ①～③ 要不要一起修（2026-10-29）：

> 好，併進去

帳號頁（2026-10-29，看到帳號頁兩張卡都是同一個帳號、另一個帳號的舊數字）：

> 我發現這邊錯了 ? 我是要打開vscode他們才會更新嗎 ? 沒辦法vscode 看到vscode的，桌面app看到桌面的嗎? 不然limit-guard都會誤報

> 為甚麼帳號都寫[帳號 B] ? 之後會改嗎

主控列出範圍與 7 個要決定的（見下面「使用者選的答案」）之後（2026-10-29）：

> 好，開始

> 都照建議

E2E 加速的 skill 放下一輪（使用者選「好，開始」那一題的內容）。

## 談定的策略

### 之後的樣子

| | 現在 | 這一輪之後 |
|---|---|---|
| 對話開始／結束的自動同步 | 全域 hook 叫上一個專案 `.local/tools/autosync.mjs`；這個專案另外由專案 hook 叫客廳的 `tools/autosync.mjs` | **只剩客廳一套**：全域 hook 叫客廳的 `autosync.mjs`，照目前的資料夾同步那個專案的 `.local` |
| mods 的備份與跨機器搬運 | 上一個專案的 `.local/claude-mods/`（VM 出門時 `--restore`）；客廳只單向備份 | **客廳 `mods/` 是正本**：家裡備份進客廳，VM 從客廳還原，回家再從客廳還原 |
| 上一個專案的 `.local` | 記憶、mods、交接開場 | 只有記憶與交接開場（`claude-mods/` 留著不動，下一輪再清） |
| 同時開好幾個對話 | 上一個專案的同步沒有鎖，撞 `index.lock`（它的 `autosync.log` 10/28～10/29 有好幾次） | 客廳的同步有鎖（`withLock`），撞到的那次跳過 |
| guard、limit-guard、儀表板、出門／回家 | 寫死上一個專案，三種認法：資料夾名字（dash `LEGACY_DIR`、limit-guard `FLAT_PROJECTS`）、沒有 `.claude/project.json`（guard、dash）、`vm/devbox.json` 的 `legacy` | **不叫任何專案的名字**：每個專案讀自己的 `.claude/project.json`；guard 在沒有設定檔時用「最嚴的一份」；上一個專案的特例變成它 `project.json` 裡的資料 |

### 換手的順序（防「中間那一段」出事）

1. **guard 的特例變成資料，沒有設定檔時用「最嚴的一份」**（＝今天上一個專案的規則，不再叫它的名字）。上一個專案有好幾條分支與 worktree，
   `project.json` 只會在含有那次合併的分支上；沒有設定檔就掉到一般規則會**少問**，所以最嚴預設一直留著（01）。
2. **客廳的 devbox 能照通用流程處理上一個專案、mods 改從客廳搬**（VM 那一半也是），`.local` 整個同步（04）。
3. **一次換手**（05）：平放的開場先**複製**進子資料夾（不搬）→ 儀表板一律叫客廳的 devbox → 全域 hook 換成客廳的同步、這個 repo 的專案 hook 拿掉 → limit-guard 的開場一律放主資料夾的子資料夾。
4. **緊接著開 VM 走一次**（08）：VM 上的全域 hook、舊的關機同步停用（drop-in）、VM 上平放的開場複製進子資料夾，都在 VM 上任何對話開始之前做。
5. **上一個專案加 `.claude/project.json`**（從乾淨的 clone 開分支，不動它的工作目錄）、刪平放的開場、把剩下寫死它的地方收乾淨（06）。

hook 換手、「mods 改由客廳搬」、VM 那一半**一定要接著做完**：只做一半，VM 的「出門」會用舊 `.local` 的舊 mods 蓋掉新的，舊的 sync-claude 也還可能被叫到。
**從 04 做完到 08 做完之間，使用者不要按出門／回家**（客廳的工具存檔就生效）。

### 使用者選的答案（2026-10-29「都照建議」）

| # | 問題 | 答案 |
|---|---|---|
| 1 | 上一個專案的設定檔放哪 | 在它的 repo 加 `.claude/project.json`（只新增一個檔；照它自己的 `CLAUDE.md` 開 PR、合併） |
| 2 | 上一個專案的 skill 換成客廳的版本 | **這一輪不換**（`project.json` 不放 `skills`），下一輪看過差異再換 |
| 3 | guard 在上一個專案碰到不認得的 Firebase 專案 id | **要問**（只會多問，不會少問） |
| 4 | 另一個帳號的資料夾能不能在 VS Code 一鍵切 | **要**（現在 `accounts.json` 標成不出現在切換清單） |
| 5 | 最後開 VM 走一次出門／回家 | **可以**，開一次，用完關機 |
| 6 | 自動同步會把改到一半的 mod 備份上去 | **不改程式，改規矩**：改 mod 不要求「一個 commit」，只要求最後一個 commit 的狀態完整 |
| 7 | 上一個專案 `.local/tools/` 的舊同步工具 | **這一輪不改、不刪**，只是不再叫它；VM 上它的關機同步（`devbox-presync`）停用 |

### 上一個專案一律不能壞

- 它既有的測試（guard、limit-guard、dash、notify、e2e-progress 的、客廳 `tools/` 的）**一條都不改**就要全過；行為有變的只有上面第 3、4 題與下面列的幾項，而且每一項都有新測試。
- 會改到它的：它的 repo 只新增 `.claude/project.json`（第 1 題）；家裡與 VM 的 `~/.claude/settings.json` 全域 hook；VM 上它的關機同步停用。**它 `.local/tools/` 的檔一個都不改**（第 7 題）。
- 它的 `.local` 照舊整個自動推（記憶、開場，加上 `references/`、`tools/` 等；它的 `CLAUDE.md` 規定正式站備份放 `.local/references/`），只是 mods 不再進 `claude-mods/`。
- 換手那一段做的時候，上一個專案不要有開著的對話（主控開段前問使用者）。

### 允許改的既有測試

其他既有測試一條都不改。下面這幾條是因為「行為會變的」而必須改，改的時候在 commit 訊息與「做完時留下的」逐條寫為什麼：

- guard：`tests/legacy-parity.test.ts`（只對 01 判準列的兩類「多問」寫例外）、`tests/project-config.test.ts:31,112`（`legacy` 布林拿掉）、
  `tests/guard.test.ts:30`（只改 `touched('firebase deploy --only hosting')` 的期待值：`staging:write` → `unknown:write`）、
  `tests/project-config.test.ts:51`（「讀設定那條路」改成跟「最嚴預設＋那份 `.firebaserc` 的 id」比）。後兩行都靠 `classify()` 預設參數裡寫死的上一個專案 id，
  拿掉之後是 01 判準允許的第 2 類「多問」（段 1 發現，主控 2026-10-29 照建議補進來）
- **同一類之後不用再問**（主控 2026-10-29）：因為拿掉寫死的 id 而變成「多問」的既有測試期待值，照上面的做法改，記進這裡與那支 issue 的「做完時留下的」；會「少問」的停下來問
- guard（**段 8**，段 7 審查第 7 條；使用者 2026-10-29 選段 8 修「`project.json` 壞掉＝最嚴預設」時就說好，段 7 第 1 題「照建議」再加「一律要問」）：
  - `tests/project-config.test.ts:112`「`project.json` 壞掉：當成有設定（認不出就問）」→ 改成「壞掉＝最嚴預設」：`mainDeploysProd` 的期待值從 `false` 變 `true`，另外斷言它被標成讀不懂
  - `tests/strict-default.test.ts` 的 `CONFIGS`「`project.json` 壞掉」那一列（段 1 加的，跟 `881473b` 逐條比、要求判斷不變）拿掉；換成新的一條：三種壞法（不是 JSON、`[]`、`null`）的判斷＝最嚴預設的判斷，再多一個「`.claude/project.json` 讀不懂」要問
- limit-guard：`tests/handoff-dir.test.ts:58-64,86-98`、`tests/worktree-handoff.test.ts:64-95`（`FLAT_PROJECTS` 拿掉、worktree 一律用主資料夾名）
- 客廳 `tools/devbox.test.mjs`（**主控 2026-10-29 照 A**；段 3 發現，issue 04 做法 3 拿掉 `devbox.mjs` 的 `legacy` 分支，測 legacy 的跟著改）：
  - 刪 4 條（只在測「叫上一個專案自己的 devbox.mjs」）：「回家（VM 關著）：上一個專案在 VM 上有沒推的 → 它的 devbox.mjs 停下來…」「回家（VM 開著）：上一個專案停下來就不關 VM」「出門：上一個專案的出門停下來…」「上一個專案的 devbox.mjs 不見了…」。
    每條在 `tools/devbox-mods.test.mjs` 有一條上一個專案（`projects` 的一列）當主角的新測試：VM 關著回家時它有沒推的 → 整個停住、每個專案的程式碼都不動；VM 開著回家時它有沒推的 → VM 不關；出門時它在 VM 上有沒 commit 的 → 整個停住、VM 上其他專案也不動；`projects` 有一列的 `home` 不存在 → 停下來講是哪一列
  - 5 條只拿掉 `legacyCalls()` 那一行斷言（情境與其他斷言不動）：「回家（VM 關著）：關機時記下這個專案有沒推的…」「…vm-state.json 比 VM 最後一次開機舊…」「…都推了 → …」（標題的「上一個專案先回家，」拿掉）、
    「出門：都好 → …」（標題的「先叫上一個專案的 out，再」拿掉，連同「它的 out 印在 ③ 之前」那一行）、「--project 不在清單上…」。理由：`legacy` 拿掉之後沒有東西會叫那支假的 devbox.mjs
  - `before()` 的假設定拿掉 `legacy` 那一格（新的 `devbox.mjs` 看到這一格會停下來叫你搬進 `projects`）；開頭說明改成「假的上一個專案 devbox.mjs 留著，確認它沒被叫到」
- dash：`tests/vm-projects.test.tsx:63-81`、`tests/vm.test.tsx:7`（雲端分頁一律叫客廳的 devbox）
- dash：`tests/vm-projects.test.tsx:98-106`「新專案但客廳還沒 clone → 照舊叫上一個專案那一支」（**主控 2026-10-29 照 A**；段 4 發現）：改成「客廳還沒 clone → 不畫出門／回家、不叫任何一支、寫出要 clone 到哪」。
  理由：05 做法 2 要拿掉 `LEGACY_DIR`，留這條退路的話上一個專案的 devbox.mjs 會叫到舊的 sync-claude（過目抓到的第 1 條）；拿掉之後是「不做」，不是少問

### 行為會變的（使用者點過頭的）

- guard：上一個專案 `firebase deploy --project <不認得的 id>` 要問（第 3 題）。
- limit-guard：已用的 % 還低時，速度不看只有 3 分鐘取樣的「最近 10 分鐘」（儀表板那輪中途發現 ②，「好，併進去」）；桌面 app 用 `CLAUDE_CODE_USER_EMAIL` 認現在的帳號（③）。
- 儀表板：同一個帳號（同一個 email）合成一張卡；另一個帳號的資料夾出現在切換清單（第 4 題）。
- 上一個專案的交接開場改放 `handoffs/baobao-wellness-clinic-scheduler/`（拿掉 `FLAT_PROJECTS`），舊的平放的複製進去（VM 換完才刪）；每個專案的 worktree 開場一律放主資料夾的子資料夾。
- 客廳的自動同步對每個專案的 `.local` 整個 commit（`git add -A`，照 `.local/.gitignore`），不只記憶與開場：這個專案的 `.local` 其他檔（例如主控交接檔）也會自動推。
- mods 的備份：家裡與 VM 都會推進客廳；上游在這台上次同步之後被改過、這台還沒還原時，不備份、只寫 log（不准默默蓋掉另一台改的）。
- guard：沒有 `.claude/project.json` 的資料夾用「最嚴的一份」（＝今天上一個專案的規則）；寫死的上一個專案 Firebase 專案 id 拿掉（讀不到 `.firebaserc` 就要問）。
- guard：`.claude/project.json` 在、但讀不懂（不是 JSON、`[]`、`null`）＝最嚴預設，**再加**碰 Firebase／`gcloud`（模擬器除外）與 `git push`、`gh` 的寫入一律要問，框上寫「`.claude/project.json` 讀不懂，先修好」（段 7 審查第 7 條；使用者 2026-10-29 選段 8 修「壞掉＝最嚴預設」，段 7 第 1 題「照建議」）。`gh` 的寫入是段 8 加的（`neverWrite` 的 repo 本來也擋 `gh` 寫入，只會多問）
- guard：`firebase use <認不出的專案>`（不是 `.firebaserc` 的正式站或 staging）每個專案都要問（issue 01「跟 issue 寫的不同」第 1 點：不加的話讀不到 `.firebaserc` 時 `firebase use <正式站 id>` 會少問）；`firebase use default` 照 `.firebaserc` 的 `default` 指的專案認（staging 不問、正式站或認不出的要問），沒有 `default` 別名不問（段 7 審查第 10 條；使用者 2026-10-29 段 7 第 1 題「照建議」）

## 不做（這一輪）

- app 的任何程式碼
- E2E 加速的 skill（下一輪）
- 上一個專案的 skill 換成客廳版（第 2 題）
- 刪上一個專案 `.local/tools/` 的舊工具、`.local/claude-mods/`（第 7 題，下一輪）
- 段 6 審查列的「異味」（Duplicated Code、Repeated Switches 等）只在順手碰到的地方整理，不專門開一支

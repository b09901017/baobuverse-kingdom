# 06 上一個專案加 project.json、拿掉剩下寫死它的地方、刪平放的開場

Status: done
Type: task
Blocked by: 01, 04, 05, 08

## 動工前先讀

- [`../spec.md`](../spec.md)「換手的順序」第 4 步、「使用者選的答案」第 1、2 題
- 01、04、05、08 底下的「做完時留下的」（新欄位、最嚴預設、開場路徑、VM 換完沒有）
- 客廳 `docs/project-config.md`、`README.md`、`settings/`、`vm/`（`vm/existing/` 是 VM 原本的複本，可以留著上一個專案的名字）
- 上一個專案的 `CLAUDE.md`（它的基底分支、PR、合併規定；**照它的規定**開 PR、合併）、`.firebaserc`

## 使用者要的

> 我只要更新客廳的東西，我的所有專案都可以更上

第 1 題：在上一個專案的 repo 加 `.claude/project.json`（只新增一個檔）。第 2 題：這一輪**不換** skill（`project.json` 不放 `skills`）。

## 為什麼會這樣

段 6 審查：「認上一個專案」有三種認法（資料夾名字、沒有 `project.json`、`devbox.json` 的 `legacy`）；上一輪 limit-guard 的 worktree 開場放錯地方（⑤）就是認法不一致造成的。
01、04、05 做完之後，三種認法都已經拿掉或改成「沒有設定檔＝最嚴的一份」；這一支把剩下的收乾淨，並讓上一個專案明確寫出自己的設定。

## 做法

1. **上一個專案的 `project.json`**：它現在不在基底分支上（在 `claude/availability-sheet-chart-no`，還有 `.claude/worktrees/`），**不要動它的工作目錄與分支**。
   在 scratchpad 另外 clone 一份（或 `git worktree add` 到 scratchpad —— 選不會改它工作目錄的那種），從它的基底分支開一條分支，**只新增** `.claude/project.json`：
   01 定的欄位、值等於最嚴預設；`neverWrite` 照它需要的（沒有就不寫）；**不寫 `skills`**。照它的 `CLAUDE.md` 開 PR、合併。
   （合併前後，它沒有這個檔的分支與 worktree 照樣用最嚴預設＝跟今天一樣，所以不急、不會少問。）
2. **刪平放的開場**：08 確認 VM 那一半換完、VM 上也不再跑舊的 sync-claude 之後，刪掉 `~/.claude/mods-data/handoffs/` 第一層的 `*.json`（05 已複製進子資料夾）。
   VM 上的平放開場照 08 的做法處理。
3. 收乾淨：程式與文件裡剩下的「上一個專案」特例（客廳 `docs/project-config.md`「讀不到設定時」、`README.md`、`settings/`、`vm/README.md`；
   dash `register.tsx` 的註解如 `:1932`；測試裡靠舊認法的假資料，例如 `vm-projects.test.tsx:63-81`、`vm.test.tsx:7`）。
4. `legacy-parity.test.ts`：再加一組，拿上一個專案的 `project.json`（測試裡放一份複本）跑新版，跟 `e8f9058` 逐條比（01 的兩類例外照舊）。

## 判準

- 合併 `project.json` 之後：上一個專案有這個檔的分支，guard 判斷跟最嚴預設逐條相同嗎？沒有這個檔的分支與 worktree 呢？
- 程式裡還有沒有任何地方出現 `baobao-wellness-clinic-scheduler`、`legacy`、`LEGACY`、`FLAT_PROJECTS`、`LEGACY_DIR`？
  （grep 客廳 `mods/`、`tools/`、`docs/`、`README.md`、`settings/`、`vm/`（`existing/` 除外）、`~/.claude/mods`、`~/.claude/settings.json`；測試的假資料可以有）
- 刪掉平放的開場之後，上一個專案開新對話，開場自動放進輸入框的行為還在嗎？（用子資料夾裡一份新的測）
- 上一個專案的工作目錄、目前分支、worktree，這一支做完跟做之前一樣嗎？

## 規矩

改 mods 的規矩照 HANDOFF「每一段共同的規矩」。上一個專案的 repo 只新增這一個檔；它的 PR 說明、commit 訊息照它自己的規矩，不帶金鑰。

## 做完時留下的（2026-10-29，段 6）

### 做成什麼樣子

| # | 做法 | 實際做的 |
|---|---|---|
| 1 | 上一個專案的 `project.json` | scratchpad 另外 clone（`--filter=blob:none --sparse`，只 checkout `.claude/`；錯誤導到檔案 0 行；`.local/` 不在 clone 裡），從 `develop`（它 `CLAUDE.md`：「PR 的基底是 `develop`」）開 `claude/guard-project-json`，**只新增** `.claude/project.json`：01 的六個欄位、值＝`STRICT`；沒有 `neverWrite`（它要擋的正式站從 `.firebaserc` 讀，沒有別人的資料要擋）；不寫 `skills`。作者照它 repo 自己設的（GitHub noreply）。PR 見下面 |
| 2 | 刪平放的開場 | 家裡 `~/.claude/mods-data/handoffs/` 第一層 8 份（10/19～21）：刪前逐檔 `cmp` 跟 `handoffs/baobao-wellness-clinic-scheduler/` 的相同，上一個專案 `.local/claude-handoffs/` 也有同樣 8 份（有版控）。刪完第一層只剩兩個子資料夾。**VM 上那 8 份留著**（要開 VM；HANDOFF「要使用者做的」） |
| 3 | 收乾淨 | 客廳 `docs/project-config.md`（「儀表板在有 `project.json` 的專案裡叫…」那一行改成現在的樣子）、`settings/README.md`（`~/.claude-account1` 已補上 `hooks`；三份 `hooks` 對過相同）、`vm/README.md`「第 3 階段換手」標題與開頭改成「已經做完」，步驟留著給舊的映像或備份還原回來時用，加一句「還沒做：VM 第一層那 8 份」；limit-guard `register.ts:126` 的註解拿掉 `FLAT_PROJECTS` 這個名字（只改註解） |
| 4 | `legacy-parity.test.ts` 加一組 | 新 1 條：放一份上一個專案 `project.json` 的複本（跟 PR 那份逐位元相同，node 比過），`rulesFrom(.firebaserc, 它)`＝沒有 `project.json` 的規則、`rulesFrom(undefined, 它)`＝`STRICT`；每條指令跟 `e8f9058` 比：讀得到 `.firebaserc` 逐條一樣（只有 ①）、讀不到只多問（① ②） |

客廳 `8139692`（已推）：上面 3、4 的檔＋`mods/` 兩個檔；客廳 `mods/` 跟 `~/.claude/mods` 逐檔相同（`diff -rq` 0）。

### 跟 issue 寫的不同的地方

1. **`tools/devbox.mjs:114` 的 `legacy` 留著**：那是「`devbox.json` 還寫著舊格式的 `legacy` → 停下來叫你搬進 `projects`」的檢查，不是上一個專案的特例，也不叫它的名字。拿掉的話舊設定會被不聲不響地忽略（那個專案跳過），而且要刪 `devbox-mods.test.mjs` 的一條（不在允許清單）。`docs/project-config.md:75` 說明它的那一行也留著。
2. **註解與文件裡的「上一個專案」幾個字沒全拿掉**：判準列的是名字與識別字（`baobao-wellness-clinic-scheduler`、`legacy`、`LEGACY`、`FLAT_PROJECTS`、`LEGACY_DIR`）。剩下的「上一個專案」是歷史說明（例如 guard `classify.ts`「`STRICT`＝原本上一個專案的規則」、`vm/README.md` 的 VM 上有什麼），不是特例，留著。
3. **dash 的測試假資料沒動**（`vm-projects.test.tsx:63-81`、`vm.test.tsx:7`）：05 已經改成「叫客廳那一支」，留下的 `LEGACY` 常數是用來斷言「上一個專案那支沒被叫到」的假路徑，判準允許。
4. **新測試不是紅燈先**：這一支沒有新行為（`project.json` 的值＝最嚴預設），測的是「一樣」。改成驗它抓得到：把複本的 `looseStaging` 暫時改成 `false` → 這條紅（31 過 1 紅），改回來 → 32 過。

### 判準

| 判準 | 結果 |
|---|---|
| 合併之後，有這個檔的分支 guard 判斷跟最嚴預設逐條相同嗎？沒有這個檔的分支與 worktree 呢？ | 有：規則物件相同（`toEqual`），每條指令判斷相同（`legacy-parity.test.ts` 新那條＋`strict-default.test.ts`「把最嚴預設的欄位全寫進 project.json」）。沒有：照舊 `STRICT`（`legacy-parity.test.ts` 前兩條）。它目前的分支 `claude/availability-sheet-chart-no` 與 10 個 worktree 都還沒有這個檔＝跟今天一樣 |
| 程式裡還有 `baobao-wellness-clinic-scheduler`、`legacy`、`LEGACY`、`FLAT_PROJECTS`、`LEGACY_DIR` 嗎？ | grep 客廳 `mods/`、`tools/`、`docs/`、`README.md`、`settings/`、`vm/`（`existing/` 除外）、`~/.claude/mods`、`~/.claude/settings.json`：**非測試的程式**只剩 `tools/devbox.mjs:114-115` 的舊格式檢查（上面第 1 點）；文件剩 `docs/project-config.md:75`（同一件事）、`vm/devbox.json`（它在 `projects` 的那一列，是資料）、`vm/README.md`「第 3 階段換手」第 3 步與「VM 壞了」第 3 步（VM 上它的資料夾路徑）。其他都在測試與 `tests/fixtures/`（假資料、改之前那一版的複本）。`~/.claude/settings.json`（與 `-account1`、`-account2`）0 筆 |
| 刪掉平放的開場之後，上一個專案開新對話，開場自動放進輸入框還在嗎？ | 測試：limit-guard `handoff-dir.test.ts`「上一個專案：自己子資料夾的開場放進輸入框」（52 過）；那條本來就只用子資料夾。**沒有真的開對話測**（開對話要使用者點） |
| 上一個專案的工作目錄、分支、worktree 做完跟做之前一樣嗎？ | 見下面「上一個專案」 |

驗證（一支一支跑）：guard `claude plugin test` 32（31＋新 1，既有的一字沒改）、limit-guard 52（只改註解）、`tsc` 兩支 0 錯、`claude plugin validate` 兩支過（警告只有原本的）。

### 上一個專案

- PR [b09901017/baobao-wellness-clinic-scheduler#186](https://github.com/b09901017/baobao-wellness-clinic-scheduler/pull/186)（`claude/guard-project-json` → `develop`，1 個檔 8 行）。CI：`rules`、`test`、`e2e`（3 分 23 秒）全綠、`deploy` 在 PR 上照它的設定跳過；照它慣用的 merge commit 合進 `develop`（`3a39a17`）。
  它的 `CLAUDE.md` 對合進 `develop` 沒有要先問的規定（基底是 `develop`；進 `main` 才上正式）。合併後 `develop` 的 push 照常重新部署 staging（程式跟原本的 staging 一樣，只多這個檔）。
- PR 內文照它的規矩：不帶真名、金鑰；附「手動驗收：沒有畫面要點」。`.claude/` 在它 `tests-e2e/related.js` 的 `IGNORED`，不用登記。
- 它的工作目錄、目前分支、`worktree list`（10 個）、每條本地分支的 commit：做之前記下（scratchpad `legacy-before.txt`），開 PR 後、合併後各對一次，**都相同**。沒有在它的資料夾 `fetch`、沒動 `.local/`（只 `ls` 了 `.local/claude-handoffs/` 的檔名、看 git 狀態）。

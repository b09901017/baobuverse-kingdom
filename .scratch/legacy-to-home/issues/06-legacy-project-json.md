# 06 上一個專案加 project.json、拿掉剩下寫死它的地方、刪平放的開場

Status: todo
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

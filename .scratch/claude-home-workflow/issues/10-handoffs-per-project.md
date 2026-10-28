# 10 交接開場分專案存

Status: done
Type: task
Blocked by: 06

## 使用者要的

> 我希望可以隔離開，就是如果是那個專案的還是推到私人 repo baobao-wellness-clinic-local中，但是這個專案的可以推到另一個私人repo中

## 為什麼

limit-guard 把所有專案的交接開場寫進同一個 `~/.claude/mods-data/handoffs/`。上一個專案的 `sync-claude.mjs` 整個資料夾照抄（`mirror`，還會刪掉來源沒有的），
所以這個專案的開場會被推進 `baobao-wellness-clinic-local`。上一個專案的檔案不能改，所以改的是 limit-guard 寫在哪。

## 做法

- 上一個專案的開場**位置不變**（還在 `mods-data/handoffs/`）；其他專案寫到 **`mods-data/handoffs/<資料夾名>/`**（08 照這個讀）。
  上一個專案的 `sync-claude.mjs` 的 `handoffSkip` 兩個方向都跳過子資料夾，所以子資料夾不會被它抄走、也不會被它刪
- 「是不是上一個專案」比**資料夾名字**（limit-guard 的 `sameProject()`），家裡、VM、`~/acct1/` 掛載的路徑才都認得
- 要改兩處：每個對話系統提示裡叫 Claude 寫開場的那一句（`advice.ts`、`register.ts` 的 handoffs 路徑），以及讀開場（新對話自動放進輸入框）—— 讀的時候舊位置與子資料夾都要讀，`tests/next.test.ts` 才會過；dash 若有讀也一起改
- 目前的 8 份都是上一個專案的，不搬
- 改完複製一份進客廳

## 判準

- 在這個 repo 存一份開場，它不在 `mods-data/handoffs/`、上一個專案的同步試跑（`node .local/tools/sync-claude.mjs` 不要跑；用它的 `autosync.mjs --dry-run` 只看數字）不會多一份？
- 在上一個專案存開場，位置與之後自動放進輸入框的行為跟以前一樣？
- limit-guard 既有測試不改全過、`tsc` 0 錯？

## 做完時留下的

改 `~/.claude/mods/limit-guard`，複製進客廳（客廳 `2c6ec10`，已推）。

- `register.ts`：`handoffDir()` 照目前專案決定寫在哪 —— 資料夾名字是 `baobao-wellness-clinic-scheduler`（`FLAT_PROJECTS`）的照舊寫 `handoffs/` 第一層，其他專案寫 `handoffs/<資料夾名，小寫>/`。
  系統提示（`segmentRule`）與 94／97% 的收尾提醒（`noteFor`）都從這裡拿路徑，所以兩處一起變。
  讀開場（`latestHandoff`）第一層與自己的子資料夾都讀，再照原本的 `sameProject()` 篩。上一個專案只讀第一層，跟以前完全一樣。
  第 3 階段（上一個專案改用客廳的工具）時拿掉 `FLAT_PROJECTS`，它的開場搬進子資料夾。
- `advice.ts` 的 `segmentRule()`：加一段「下一段由別的 session 用 start_session 開的時候**不存**這個檔，開場照樣寫進 HANDOFF.md」（段 2 的中途發現，從源頭解）。上一個專案的系統提示也會多這段，它不用 start_session 時行為不變。
- dash、其他 mod 沒有讀 `handoffs/`（grep 過），不用改。

**判準**

- 在這個 repo 存一份開場，它不在第一層、上一個專案的同步不會多一份？✓
  在 `handoffs/baobuverse-kingdom/` 放一份（標成用過），把上一個專案的 `sync-claude.mjs` **複製到暫存資料夾**跑（`autosync.mjs --dry-run` 其實會把記憶與 mods 抄進上一個專案的 `.local` 工作目錄，所以沒跑它）：
  抄走的開場還是 8 份、沒有子資料夾。反方向（`--restore`）的 `handoffSkip` 對資料夾一律跳過，也不會刪它。驗完那一份已刪。
- 在上一個專案存開場，位置與自動放進輸入框的行為跟以前一樣？✓ 新測試：上一個專案的系統提示路徑是第一層、第一層的開場照舊放進輸入框、不讀別的專案的子資料夾。
- limit-guard 既有測試不改全過、`tsc` 0 錯？✓ 既有 16 條＋新的 `tests/handoff-dir.test.ts` 8 條＝24 條全過；`tsc` 0 錯；`claude plugin validate` 通過。其他四支 mod 的測試基準（dash 11、e2e-progress 5、guard 10、notify 3）動工前全過。

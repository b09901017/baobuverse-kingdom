# 10 交接開場分專案存

Status: todo
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

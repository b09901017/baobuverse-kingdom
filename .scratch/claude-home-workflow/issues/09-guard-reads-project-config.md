# 09 guard 改成讀目前專案的 Firebase 設定

Status: todo
Type: task
Blocked by: 06

## 使用者要的

> 然後你說現在榜的是舊專案不能幫我把這個綁的變成一個變數之類的嗎，就是我開心專案就可以綁這個新的
> 也就是我希望我之後新增專案也可以用那個專案的firebase

## 為什麼

`~/.claude/mods/guard/hooks/classify.ts` 寫死 `wellness-clinic-scheduler`（正式）與 `wellness-clinic-staging`。
在這個專案它不會擋任何東西，而這個專案有一條「絕對不寫入」：國王日記 `b09901017/baobu_money_track` 的資料，以及 `baobu-app` 的預設 Firestore database（`CLAUDE.md`）。

## 做法

- guard 從目前資料夾的 `.firebaserc`（`projects.prod`／`projects.staging`）讀正式與 staging；「絕對不寫入」的清單放 06 定好的專案設定
- 寫死的不只專案 id：`classify.ts` 約 87 行「認不出目標的 firebase 指令一律當 staging、不問」只對上一個專案成立（它的 `.firebaserc` default 是 staging）。
  改成：只有目前資料夾的 `.firebaserc` default 是 staging 時才這樣推定，其他情況認不出就要問。
  寫死的 npm 腳本名稱、「推到 main 就是部署正式站」（`classify.ts`、`register.ts`）也只套用在上一個專案
- 「絕對不寫入」另外檢查，用具體指令寫測試：`firebase deploy --project baobu-app`、對 `baobu-app` 的 `(default)` database 的 REST 寫入、`git push` 到 `baobu_money_track`
- 拿上一個專案 `.firebaserc` 的**複本**當測試資料，把舊的案例經過「讀設定」那條路再跑一次（既有測試直接呼叫 `classify()`，證明不了讀設定那條路）
- 這個 repo 加那份設定：`baobu-app` 預設 database 與 `baobu_money_track` 一律要問
- 改的是 `~/.claude/mods/guard`（上一個專案每天在用），改完複製一份進客廳

## ⚠️ 上一個專案的行為必須完全一樣

- guard 既有的測試**一條都不改**就要全過；新行為加新的測試
- 在上一個專案的資料夾，`.firebaserc` 讀出來的值跟原本寫死的相同，判斷結果相同
- 桌面 app 的 session 看起來沒有載入 mods（上一個專案是靠 VS Code 的 `CLAUDE_CODE_PLUGIN_DIRS` 載入的，記憶 `claude-code-mods-2026-10-16`）。
  這支照做（VS Code 與 VM 用得到），但不要自己改使用者的 VS Code 或 app 設定；「桌面 app 要不要也載入 mods」已列在 HANDOFF 給使用者決定

## 判準

- 在這個 repo 下一個會寫 `baobu-app` 預設 database 的指令，guard 會跳框嗎？（用測試證明）
- 在上一個專案寫 `wellness-clinic-scheduler` 的判斷跟改之前一樣嗎？
- guard、上一個專案相關的所有 mod 測試全過、`tsc` 0 錯？

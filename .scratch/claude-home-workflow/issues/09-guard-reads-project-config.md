# 09 guard 改成讀目前專案的 Firebase 設定

Status: done
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

## 做完時留下的

改 `~/.claude/mods/guard`，複製進客廳（客廳 `c1cf8f8`，已推；段 4 中斷時做到一半的部分已被客廳的自動同步先備份成 `0b44bbd`，兩個合起來才是完整的 09）。這個 repo 的 `.claude/project.json` 加 `neverWrite`。

- `classify.ts`：`rulesFrom(.firebaserc, .claude/project.json)` → `Rules`。**沒有 `project.json` 的專案（上一個專案）＝ `LEGACY`**，判斷跟以前一樣（它的 `.firebaserc` 讀出來也正好等於 `LEGACY`）。
  `project.json` 在但壞掉：當成有設定（認不出就問），不退回比較寬的舊規則。
- 有 `project.json` 的專案：
  - 沒寫 `--project` 的 firebase 寫入：`.firebaserc` 的 default 是 staging 才推定 staging，其他要問；寫了 `--project` 卻不是它的正式站或 staging 也要問（做測試時發現的洞，上一個專案照舊）。
  - npm 腳本名稱、預設讀正式站的唯讀腳本、「推 main＝部署」、`gh workflow run deploy --ref main` 不套用。
  - 新的風險 `neverWrite`（框上寫「寫絕對不能寫的地方」）：firebase CLI、`gcloud firestore` 的寫入、Firestore REST 寫入（看 URL 的 `databases/<名字>`，`%28default%29` 也認）、會寫 Firebase 的腳本與 `node -e`、`git push` 與 `gh` 的寫入指令寫到那個 repo。
    寫了 `--database` 別的 database 不算。
- `register.ts`：`rulesOf()` 從 `$.session.root()` 讀兩個檔；`git push <遠端名字>`（沒寫＝origin，`git -C`、前面的 `cd` 也看）問 `git remote get-url --push`，遠端是 `neverWrite` 的 repo 就擋。
- 格式照客廳 `docs/project-config.md`，沒加欄位。

**判準**

- 在這個 repo 下一個會寫 `baobu-app` 預設 database 的指令，guard 會跳框嗎？✓ 新測試把這個 repo 的 `neverWrite` 放進假的專案資料夾，經過 `register.ts` 真的跳框、擋下：`firebase deploy --project baobu-app`、對 `(default)` 的 REST PATCH、`git push origin`（遠端是 `baobu_money_track`）。
  另外用 node 直接讀這個 repo 真的 `.claude/project.json` 跑一次，三個指令都帶 `neverWrite`。
- 在上一個專案寫 `wellness-clinic-scheduler` 的判斷跟改之前一樣嗎？✓ 上一個專案 `.firebaserc` 的**複本**（內容抄進測試）經過 `rulesFrom` ＝ `LEGACY`；`guard.test.ts` 的 25 個指令走讀設定那條路，結果跟直接呼叫 `classify()` 逐一相同；經過 `register.ts`（`session.root` 指到上一個專案的資料夾）推 main 照舊跳框、`firebase deploy --only hosting` 照舊不問。
- 測試全過、`tsc` 0 錯？✓ guard 既有 10 條不改＋新的 `tests/project-config.test.ts` 9 條＝19 條全過；`tsc` 0 錯；`claude plugin validate` 通過。其他 mod 沒動。

# 工具收尾：第 3 階段留下的清單＋E2E 加速

分支 `claude/tooling-leftovers`（從 `claude/legacy-to-home` 的 `1de96ba` 開：`main` 的 `91f5952`＋兩個只改 HANDOFF 的 commit，這一輪的 PR 一起帶進 `main`）。
上一輪的全貌在 `.scratch/legacy-to-home/`（spec、HANDOFF「下一輪要做的」「中途發現」「判斷題」）。這一輪的 issue 只寫要做什麼與判準，細節指回那裡。

## 使用者要的（原話）

2026-10-29，主控列出下一輪的候選清單之後：

> 下一輪，候選清單就一起做吧，全部完成

問 VM 的 5 項檢查清單（PR #6 內文）：

> 下次開 VM 時順便做 : 你沒幫我測試過嗎 ?

E2E 加速（第 3 階段開始前說的，主控交接記的原話）：

> 上個專案就是因為跑太久，如果是vm好像就可以多開幾個worker跑，或是都丟給github跑，本地只要跑必要的就好

> 上個專案不是也有寫優化e2的skill嗎 你可以幫我用skill-creator 幫我去更新那版e2e測試的，然後本基也可以開2 3 個worker跑沒關係，可以試試

主控說上一個專案量過「同一顆模擬器」3 個 worker 會紅之後：

> 所以就一定只能共用一顆 Firestore 模擬器 ?

上一輪就定下、這一輪照舊的原則：

> 不要影響到上個專案，畢竟那個專案還在進行中還在維護測試

## 使用者選的答案（2026-10-29，主控 session）

| # | 問題 | 答案 |
|---|---|---|
| 1 | 這一輪要不要開 VM 實測 | **開一次（建議）**：放在這一輪最後、同步那幾支改完之後；做 PR #6 的 5 項、真的走一次出門／回家，用完關機。開機前主控再提醒一次 |
| 2 | E2E 加速這一輪做到哪 | **照建議**：客廳寫通用版 skill（用 skill-creator，從上一個專案的 `test-speed` 改寫）；在上一個專案**另一份 clone 的實驗分支**試「2 個 worker、各一顆模擬器」，跟 1 個 worker 比時間與紅幾支。實驗分支不推、不開 PR，它的資料夾與分支都不動；數字寫進 skill，好的話再問要不要正式改 |
| — | 上一個專案的 skill 換成客廳的版本（上一輪 spec 第 2 題） | 上一輪答「這一輪不換，下一輪看過差異再換」→ 這一輪**先出差異報告、再問使用者**一支一支換不換（issue 08） |
| — | 刪上一個專案 `.local/tools/` 的舊工具、`.local/claude-mods/`（上一輪 spec 第 7 題） | 上一輪答「下一輪」→ 這一輪刪（有版控，救得回來） |

## 範圍

| 塊 | issue | 來源（`.scratch/legacy-to-home/HANDOFF.md`） |
|---|---|---|
| guard | 01 補現在就有的少問洞（`neverWrite` 欄位壞掉、`npx firebase-tools`、`gcloud` 全域旗標在前）；02 確定不會執行的字串不當成指令（白名單） | 段 8 中途發現 4、過目；段 1 中途發現 1、段 8 中途發現 2、5 |
| 客廳同步／出門回家 | 03 推不上就 exit 1（J1）；04 回家的家裡那一半 `pull --rebase`；05 異味整理（J2、J3、J5、J6、J8）；06 `checkProjectArg` 看主資料夾 | 判斷題 J1～J8、段 9 中途發現 1、段 4 中途發現 1 |
| 儀表板 | 07 「雲端」分頁標題讀設定（截圖）、J7、J4 | 段 6 中途發現 1、判斷題 J4、J7 |
| 上一個專案 | 08 skill 差異報告 → 使用者決定 → 換；09 刪 `.local/tools/`、`.local/claude-mods/` | spec 第 2、7 題 |
| E2E | 10 通用 skill＋實驗 | 使用者原話 |
| 教訓 | 11 `docs/agents/lessons.md` 補這輪踩的坑 | 段 2 中途發現 2、段 8 中途發現 1、6 |
| VM | 12 開一次：PR #6 的 5 項、走一次出門／回家、VM 上舊的關機同步收掉 | PR #6 手動檢查清單 |

審查（`/matt-code-review`）、PR、合併照 kickoff。

## 不能違反

- **上一個專案一律不能壞**：它的資料夾、分支、worktree、正在用的設定都不動；動它的 repo 只照它自己的 `CLAUDE.md` 開 PR（只有 08 會）。實驗在另一份 clone。
- **guard 的改動**：01 只會多問。02 是「少問」（拿掉誤判），用**白名單**：只有確定不會執行的指令（`echo`、`git commit -m`、`gh pr create --body`、`grep` 等）的引號參數、與餵給 `cat`／`tee`／`git commit -F -` 的帶引號 heredoc 內文不算；
  其他一律照現在掃。**真的會執行的一律照舊要問**（issue 02 判準 3 的清單：shell 包一層、`$(…)`、遠端、直譯器呼叫 shell、PowerShell 等），每一條有守住的測試。
- 既有測試一條都不改就要全過；要改的先停、問主控（寫進 spec「允許改的既有測試」再改）。
- 公開 repo（這個）不帶真名、帳號、email、金鑰、VM host／GCP 專案 id／zone／instance 名；查私人檔只看檔名、`--numstat`、挑過的行。
- VM 只開一次（12），用完關機。

## 允許改的既有測試

| 哪裡 | 可以改什麼 | 為什麼 | 誰同意 |
|---|---|---|---|
| 客廳 `tools/mods.test.mjs`、`tools/devbox-mods.test.mjs`（05 J8） | 只改 import 與 setup 行（把 `git`／`write`／`read` 小工具改成從 `tools/helpers-for-tests.mjs` import），**斷言不改** | J8 把兩份抄的小工具抽出去 | 主控 2026-10-29（過目抓到的 05） |
| 客廳 `tools/*.test.mjs` 四支（05 J3） | 「讓 autosync 可以被 import」需要的話，只改複製腳本進假客廳的 setup 行，**斷言不改** | 05 讓 `autosync.mjs` 可以被 import、export `mainDir` | 主控 2026-10-29 |

（段裡要再加的，寫明哪一條、為什麼，先問主控。）

## 行為會變的

（段裡寫：哪個指令、以前怎樣、現在怎樣。）

### 01 guard 補少問洞（客廳 `d3bc4a0`；只會多問）

| 寫法 | 以前 | 現在 |
|---|---|---|
| `project.json` 是合法 JSON、`neverWrite` 壞掉：`{}`、`null`、字串、`true`、`[{}]`、`[null]`、`["baobu-app"]`、`[{"firebaseProject": 1}]`、`[{"firebaseProject": ""}]`、`[{"gitRepo": ""}]`、`database`／`gitRepo` 不是不空的字串、`why` 不是字串 | 不是陣列當 `[]`、不合格的項目濾掉，**不標讀不懂**：國王日記那道保護默默消失（`gcloud firestore import … --project=baobu-app`、推國王日記的 repo 都不問） | ＝讀不懂：碰 Firebase／`gcloud`（模擬器除外）、`git push`、`gh` 寫入一律要問，框上寫「`.claude/project.json` 讀不懂，先修好（neverWrite 那一欄格式不對…）」；特例換成最嚴預設＋這份檔自己的 `writeScripts`／`npmScripts`；合格的項目照樣擋 |
| `npx -y firebase-tools@latest deploy …`、`npx firebase-tools firestore:delete …`、`npm exec firebase-tools -- deploy`、`npm x`、`pnpm dlx`／`exec`、`yarn dlx`／`exec`、`bunx`、`bun x` 跑的 `firebase-tools` | 完全認不出：不問、不記 | 跟 `firebase <子指令> …` 同一種判斷（要問的問、碰了什麼照記） |
| `firebase.cmd …`、`firebase.exe …`、`firebase.ps1 …`、`firebase.js …` | 認不出 | 跟 `firebase …` 同一種判斷 |
| firebase 全域旗標寫在子指令前面：`firebase --project prod deploy`、`firebase -P baobu-app firestore:delete …`、`firebase --debug deploy …` | 子指令被當成旗標（`--project`），只記一筆讀、不問 | 子指令認成 `deploy`／`firestore:delete`，跟旗標寫在後面同一種判斷 |
| `gcloud` 全域旗標寫在 `firestore` 前面：`gcloud --project=baobu-app firestore import …`、`gcloud --quiet --project=… beta firestore import …` | 認不出，不擋 | 照 `neverWrite` 擋（跟寫在後面同一種判斷；`export` 照舊不問） |
| `firebase -P prod`（只有旗標、沒有子指令） | 記一筆讀「firebase -P」 | 記一筆讀「firebase prod」（都不問，只是記的字不同） |

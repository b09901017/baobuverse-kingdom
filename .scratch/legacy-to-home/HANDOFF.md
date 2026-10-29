# HANDOFF：第 3 階段（上一個專案改用客廳的工具）

分支：`claude/legacy-to-home`（這個 repo）。全貌在 [`spec.md`](./spec.md)，issue 在 [`issues/`](./issues/)。
主控 session 依序自動開下一段；每段做完更新這份、寫好下一段的開場，主控照它開下一個 session。

## 分段

| 段 | issue | 建議 effort | 狀態 |
|---|---|---|---|
| 1 guard、規則文件 | 01、07 | high | ✅ `701b8fa`、`927b43c`（客廳 `30a7191`、`2e1f9b5`、`0aa707a`） |
| 2 limit-guard 與儀表板帳號頁（都以 email 為單位） | 02 → 03 | high | ⬜（03 改到畫面：停下來等截圖） |
| 3 客廳的出門／回家、mods 改從客廳搬 | 04 | xhigh | ⬜（做完到段 5 做完之間，使用者不要按出門／回家） |
| 4 換手 | 05 | high | ⬜（開段前主控問使用者：上一個專案有沒有開著的對話） |
| 5 開 VM 走一次 | 08 | high | ⬜（緊接段 4；開 VM 花錢，使用者已同意一次） |
| 6 上一個專案的 project.json、收乾淨、刪平放的開場 | 06 | high | ⬜ |
| 7 審查 | `/matt-code-review`：這個 repo `main...claude/legacy-to-home`＋客廳這一輪的 commit＋上一個專案新增的 `project.json` | xhigh | ⬜ |
| 8 收尾 | 修審查找到的、手動檢查清單、PR、合併 | medium（要修 mods 就 high） | ⬜ |

## 每一段共同的規矩

- 動工前讀：這份、`spec.md`、這一段的 issue、`CLAUDE.md`、`docs/agents/lessons.md`；前面幾支 issue 底下的「做完時留下的」
- 一支 issue 一個 commit（這個 repo）；`Status:` 改 `done`，issue 底下寫「做完時留下的」（實際做成什麼樣子、跟 issue 寫的不同的地方）
- **改 `~/.claude/mods`**：既有測試一條都不改就要全過、新行為先寫紅燈測試再修到綠、tsc 0 錯（`npx -y -p typescript@5 tsc -p <mod 資料夾> --noEmit`；notify 沒有 tsconfig 不跑）、
  `claude plugin validate <mod 資料夾>` 過；改完複製進客廳 `mods/`、客廳 commit、推；客廳 `mods/` 跟 `~/.claude/mods` 逐檔相同。
  客廳的自動同步可能先把改到一半的檔備份成「自動同步」commit：**最後一個 commit 的狀態完整就好**（spec 第 6 題）。
- 測試一支一支跑，不要平行全開（使用者的電腦曾經過熱斷電）。客廳的 node 測試寫檔名跑：`node --test tools/devbox.test.mjs`、`node --test tools/autosync.test.mjs`（**不要** `node --test tools/`）。
  基準（2026-10-29）：dash 27、e2e-progress 5、guard 24、limit-guard 30、notify 6；客廳 autosync 12、devbox 18。
- **上一個專案**（`C:/Users/DELL/Desktop/baobao-wellness-clinic-scheduler`）：`.local/tools/` 的檔一個都不改（spec 第 7 題）；它的 repo 只在 issue 06 新增 `.claude/project.json`；
  它的 `.local/references/` 不讀。
- 公開 repo（這個）：commit、`.scratch`、PR 不帶真名、帳號名字、email、金鑰、VM host／GCP id。`~/.claude/mods-data/accounts.json`、客廳 `vm/devbox.json` 的值不要印出來、不要抄過來。
- 推到私人 repo、改 `~/.claude/settings.json`、改 skill 被 auto mode 擋下：**停**，寫進下面，請使用者做或交給主控，不要繞。
- 中途發現的事不岔出去修，記進下面「中途發現」（哪裡、什麼情境會錯、建議）；使用者說要修的，修之前再 grep 一次牽連。
- 改一個函式、一段文件或畫面上的字之前，grep／graphify 找出所有用到它的地方。
- subagent 同時最多兩個。
- 段自己不開 session、不存 limit-guard 的開場 JSON：主控照這份的開場開下一段。
- 畫面有改的（儀表板）：電腦操作不能控制 Claude 自己的視窗。改完停下來回報「要截圖看哪幾頁」，主控請使用者在新對話點、截圖。
- 一段做完：更新這份（狀態、中途發現、要使用者決定的）、寫好下一段的開場，然後結束。最後回覆用繁體中文簡短說做了什麼、卡在哪。

## 過目抓到的

唯讀的 subagent（Plan）對著程式碼過目 8 支 issue；主控自己對了最重的幾條（客廳 `autosync.mjs:236-250`、`devbox.mjs:144-152`、guard `register.ts:62-70`、`vm/existing/devbox-presync.service`、上一個專案 `sync-claude.mjs:28,77-79`），都成立。改了：

| # | 抓到的 | 改成 |
|---|---|---|
| 1 | 舊的 sync-claude 鏡像 `handoffs/` 第一層：平放的開場搬走後它會把 `.local/claude-handoffs/` 刪光推上去。05 之後還會被叫到：儀表板在上一個專案叫舊 devbox、VM 的全域 hook、VM 的 `devbox-presync` | 05 改成「先複製、不搬」，刪平放的移到 06（VM 換完之後）；儀表板改叫客廳 devbox 從 06 提前到 05；VM 的全域 hook 加進 08；08 緊接 05 |
| 2 | 客廳 `backupMods` 先 `pull` 再整份鏡像再推：兩台都能推之後，慢的那台開對話就把另一台改的 mods 蓋回去 | 04 加「基準點」：上游在這台上次同步之後改過、這台還沒還原 → 不備份、只寫 log |
| 3 | 通用流程只 commit 記憶與開場；上一個專案的舊同步是 `git add -A`（`references/`、`tools/`），換手後沒人推，而且 `pushLocal`／`checkVmState` 看到沒 commit 的檔就停 → 出門、回家卡住 | 04 改成 `.local` 整個同步（每個專案），寫進 spec「行為會變的」 |
| 4 | 06 拿掉內建預設會「少問」：`project.json` 只在含合併的分支上，上一個專案有別的分支與 worktree | 01 改成「沒有設定檔＝最嚴的一份」（＝今天上一個專案的規則），一直留著；06 只拿掉名字與寫死的 id |
| 5 | `devbox-presync` 是 `RemainAfterExit`＋`ExecStop`：只 `disable` 這次關機照樣跑、`disable --now` 立刻跑一次 | 04、08 改成先 drop-in 把 `ExecStop` 換成 `/bin/true` 再 `disable` |
| 6 | 02：30 分鐘那段只要 4 分鐘取樣（`advice.ts:63`），兩個選項都過不了判準 1；門檻剛好 20% 有既有測試 | 02 改成「< 20% 時兩段都要取樣夠長，不夠就用整個視窗平均」；判準寫明距離重置幾分鐘 |
| 7 | 05：worktree 的開場現在不看主資料夾、客廳同步看工作目錄的資料夾名；開新對話只放 3 天內沒用過的 | 05 改成 worktree 一律用主資料夾名；判準用新的開場測 |
| 8 | 允許改的既有測試沒列 | spec 加「允許改的既有測試」 |
| 9 | 02 與 03 是同一個「以 email 為單位」；06 不需要 Blocked by 02、03；08 不需要 Blocked by 06 | 分段改成 02、03 同一段；08 在 06 之前 |
| 10 | 04 漏的：VM 關著時第一次回家沒有 `vm-state.json`；關機同步會超過 `TimeoutStopSec=80`；mods 沒有 `package.json` | 都加進 04 |
| 11 | 上一個專案不在基底分支、有 worktree | 06 改成在 scratchpad 另外 clone 開分支，不動它的工作目錄 |
| 12 | 家裡的 `gcloud` 被防毒擋 | 08 用 `devbox.mjs status` |
| 13 | `issue-tracker.md` 有三套狀態說法 | 07 一起定 |

公開 repo：沒有 email、VM host、GCP 專案 id、金鑰；帳號名字已遮成「帳號 B」。

## 段 1 的開場

建議 effort：**high**。

```
這一輪是「第 3 階段」：上一個專案改用客廳的工具，拿掉所有寫死它的特例。分支 claude/legacy-to-home（已經在這個 checkout 上）。
這是第 1 段：做 issue 01（guard 的特例規則變成資料，沒有設定檔時用「最嚴的一份」）→ 07（規則文件整理），照這個順序。不做其他的。

先讀：.scratch/legacy-to-home/HANDOFF.md 的「每一段共同的規矩」「過目抓到的」、spec.md（含「允許改的既有測試」）、issues/01、07 全文、CLAUDE.md、docs/agents/lessons.md、
客廳 C:/Users/DELL/claude-home 的 README.md 與 docs/project-config.md。動工前 git -C C:/Users/DELL/claude-home pull --ff-only。

要特別注意：
- 01：沒有 .claude/project.json 的資料夾（上一個專案的任何分支、worktree）判斷結果跟 e8f9058 那一版要逐條相同（tests/legacy-parity.test.ts），
  只允許 issue 01 判準列的兩類「多問」。「最嚴的一份」一直留著（不是暫時的），只是不再叫上一個專案的名字；寫死的上一個專案 Firebase 專案 id 拿掉。新欄位寫進客廳 docs/project-config.md。
- 07：改 kickoff 改客廳的正本再同步回來。改 skill 可能被 auto mode 擋（由別的 session 轉達的改 skill 會被當成改自己的設定）：被擋就停、寫進 HANDOFF，主控在自己的 session 做，不要繞。
  這個 repo 的 CLAUDE.md「不能違反」的幾條一定留。
- 改 ~/.claude/mods 的規矩照 HANDOFF「每一段共同的規矩」。改任何函式或文件裡的字之前 grep 所有用到它的地方。中途發現的事記進 HANDOFF，不岔出去修。
- subagent 一次最多兩個。主控會開下一段：不要自己開 session，也不要存 limit-guard 的開場 JSON。
- 上一個專案 C:/Users/DELL/Desktop/baobao-wellness-clinic-scheduler 的檔案只讀不改；它的 .local/references/ 不讀。公開 repo 不帶真名、帳號、email、金鑰。

做完要交：每支一個 commit（這個 repo 推到 origin claude/legacy-to-home；客廳推到它的 main）、Status: done、issue 底下「做完時留下的」、
HANDOFF 更新（狀態、中途發現、要使用者決定的）、段 2 的開場與建議 effort 寫進 HANDOFF。最後回覆用繁體中文簡短說做了什麼、卡在哪。
```

## 段 2 的開場

建議 effort：**high**。

```
這一輪是「第 3 階段」：上一個專案改用客廳的工具，拿掉所有寫死它的特例。分支 claude/legacy-to-home（已經在這個 checkout 上）。
段 1 做完了：issue 01（guard 的特例變成 Rules 的欄位、沒有 project.json 用最嚴預設；這個 repo 701b8fa、客廳 30a7191＋2e1f9b5）、07（規則文件；927b43c、客廳 0aa707a）。
這是第 2 段：做 issue 02（limit-guard：剛開對話不亂喊快用完、桌面 app 認對帳號）→ 03（儀表板帳號頁：同一個 email 一張卡、另一個帳號能在 VS Code 一鍵切），照這個順序。不做其他的。

先讀：.scratch/legacy-to-home/HANDOFF.md 的「每一段共同的規矩」「過目抓到的」（第 6 條是 02 的）、「中途發現」「要使用者決定的」段 1；spec.md（含「允許改的既有測試」「行為會變的」）；
issues/02、03 全文；issues/01、07 底下「做完時留下的」；CLAUDE.md；docs/agents/lessons.md；
.scratch/dash-desktop/issues/01-dash-desktop.md 的「中途發現」② ③ 與「三、額度預報」；客廳 C:/Users/DELL/claude-home 的 README.md「mods」一節。動工前 git -C C:/Users/DELL/claude-home pull --ff-only。

要特別注意：
- 02 與 03 是同一件事「以 email 為單位認帳號」：先在 02 定好認帳號的做法（桌面 app 用 CLAUDE_CODE_USER_EMAIL，跟 dash 的 refreshAccounts 一致），03 照用，不要兩支各寫一套。
- 02 的速度：已用的 % 還低（< 20%）時兩段都要取樣夠長，不夠就用整個視窗平均；門檻剛好 20% 有既有測試。判準寫明距離重置幾分鐘。
- 03 改 ~/.claude/mods-data/accounts.json（使用者資料、有 email 與名字）：改之前先備份到 scratchpad，值不要印出來、不要抄進任何 repo。
- 03 改到畫面：電腦操作不能控制 Claude 自己的視窗。改完停下來回報「要截圖看哪幾頁、怎麼點」，主控請使用者在新對話點、截圖；截圖沒過之前 03 不算 done。
- 改 ~/.claude/mods 的規矩照 HANDOFF「每一段共同的規矩」（既有測試不改全過——允許改的只有 spec 列的、紅燈先、tsc、validate、複製進客廳、推、客廳 mods/ 跟 ~/.claude/mods 逐檔相同）。
  客廳那邊不要求一支一個 commit，最後一個 commit 狀態完整就算數（kickoff 新規矩）。這個 repo 照舊一支一個 commit。
  因為拿掉寫死的名字或 id 而變成「多問」的既有測試期待值：照 spec「允許改的既有測試」最後一條直接改、記進 spec 與「做完時留下的」；會「少問」的停下來問主控。
- guard 會把 commit 訊息、heredoc 裡寫到的「firebase deploy」當成指令（中途發現 1）：被跳框問時照實說明，不要改寫法繞。
- 改任何函式或畫面上的字之前 grep 所有用到它的地方。中途發現的事記進 HANDOFF，不岔出去修。subagent 一次最多兩個。
- 主控會開下一段：不要自己開 session，也不要存 limit-guard 的開場 JSON。
- 上一個專案 C:/Users/DELL/Desktop/baobao-wellness-clinic-scheduler 的檔案只讀不改；它的 .local/references/ 不讀。公開 repo 不帶真名、帳號、email、金鑰。

做完要交：每支一個 commit（這個 repo 推到 origin claude/legacy-to-home；客廳推到它的 main）、Status: done、issue 底下「做完時留下的」、
HANDOFF 更新（狀態、中途發現、要使用者決定的）、段 3 的開場與建議 effort 寫進 HANDOFF。最後回覆用繁體中文簡短說做了什麼、卡在哪（03 要截圖的頁面列清楚）。
```

## 中途發現

### 段 1

| # | 哪裡 | 什麼情境會錯 | 建議 |
|---|---|---|---|
| 1 | guard `classify.ts` 的 firebase CLI 那一段（`/\bfirebase\s+([\w:-]+)…/g` 掃整行指令） | 指令**字串裡**寫到 `firebase deploy` 也算：`git commit -m` 的訊息、`python - <<EOF` 裡的字串、PR 內文。段 1 有 4 次被記成「看不出是哪一個環境寫（firebase deploy）」（有寫入的那種照規則還會跳框問）。`node -e`／heredoc 那一段已經有「只算真的交給 node 跑的」判斷，firebase CLI 這段沒有 | firebase CLI 只看「一段指令的開頭」（`;`、`&&`、`\|`、換行之後的第一個字），跳過 heredoc 的內文與引號裡的字。屬於「多問」不是「少問」，不急；下一輪或段 8 一起修 |
| 2 | guard `rulesFrom` | `project.json` 壞掉（不是合法 JSON）照舊當成「有設定、沒有特例」：比最嚴預設**少問**推 main、`npm run restore`（但不會把認不出的推定成 staging）。這是 09 定的，01 沒動 | 要「只會多問」就改成壞掉＝最嚴預設；要的話是一行，但會改 `project-config.test.ts:112` 的意思 |


## 要使用者做的

- **段 3 做完到段 5 做完之間，不要按出門／回家**（客廳的工具存檔就生效；VM 那一半要在段 5 開 VM 時才換完）。主控在段 3 開始前跟使用者說。

## 要使用者決定的

### 段 1

1. ~~**spec「允許改的既有測試」漏了兩行**~~ → **主控 2026-10-29「照建議」**：兩行都補進 spec；`:51` 改成跟「最嚴預設＋那份 `.firebaserc` 的 id」比（客廳 `2e1f9b5`）。同一類（拿掉寫死 id → 多問）之後不用再問，會少問的才停下來問。原本的題目：
   `guard.test.ts` 的 `touched('firebase deploy --only hosting')`（`staging:write` → `unknown:write`）、`project-config.test.ts` 的「讀設定那條路跟 `classify()` 一樣」（改成跟 `e8f9058` 比）。
   兩行都靠 `classify()` 預設參數裡寫死的上一個專案 id；01 要拿掉寫死的 id，預設參數變成最嚴預設之後，這兩行就是判準允許的第 2 類（讀不到 `.firebaserc` → 看不出環境 → 要問）。
   另一個做法是預設參數留著寫死的 id（違反 01 判準 4）。
2. （不擋）中途發現 1、2 要不要這一輪修：建議 1 放下一輪（只是多問）、2 不改（09 的決定）。

## 使用者已經決定的（2026-10-29）

- spec「使用者選的答案」7 題：「都照建議」。
- 範圍：儀表板那輪中途發現 ①～③ 併進來（「好，併進去」）；E2E 放下一輪（「好，開始」）。

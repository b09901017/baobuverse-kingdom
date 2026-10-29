# HANDOFF：第 3 階段（上一個專案改用客廳的工具）

分支：`claude/legacy-to-home`（這個 repo）。全貌在 [`spec.md`](./spec.md)，issue 在 [`issues/`](./issues/)。
主控 session 依序自動開下一段；每段做完更新這份、寫好下一段的開場，主控照它開下一個 session。

## 分段

| 段 | issue | 建議 effort | 狀態 |
|---|---|---|---|
| 1 guard、規則文件 | 01、07 | high | ✅ `701b8fa`、`927b43c`（客廳 `30a7191`、`2e1f9b5`、`0aa707a`） |
| 2 limit-guard 與儀表板帳號頁（都以 email 為單位） | 02 → 03 | high | 02 ✅ `01e946d`（客廳 `8419bac`）；03 ✅ `7179dc9`（客廳 `06369c8`；截圖 10/29 過了） |
| 3 客廳的出門／回家、mods 改從客廳搬 | 04 | xhigh | ✅ `985c485`（客廳 `d7f980c`；主控查過：四支測試一支一支跑全綠、照 A 的三個條件都在、客廳 `mods/` 跟 `~/.claude/mods` 相同）。**從現在到段 5 做完，使用者不要按出門／回家**（客廳的工具已經生效，VM 那一半還沒換） |
| 4 換手 | 05 | high | ✅（客廳 `859bf74`、`8d49a61`（mods，自動同步）、`fe4af86`；開關對話重測過了；05 的截圖 10/29 過了；`~/.claude-account1` 的 `hooks` 主控 10/29 代改好了）。主控查過：limit-guard 52、dash 34、autosync 16、mods 兩份相同 |
| 5 開 VM 走一次 | 08 | high | ✅（10/29 12:03～12:22 開一次、照「回家」關機；VM 那一半換完：`devbox-presync` drop-in＋disable、全域 hook 換成客廳的、平放的開場複製進子資料夾、客廳 pull、unit 重裝；出門後 VM 跟家裡一樣、回家後家裡分支沒變；trust 使用者本人答了。客廳只有判準 5 的兩個自動同步 `807bc91`、`7e375d5`）。**關機時這個專案的 `vm-state.json` 沒推上去**（中途發現段 5 第 1 條） |
| 6 上一個專案的 project.json、收乾淨、刪平放的開場 | 06 | high | ✅（客廳 `8139692`；上一個專案 PR #186 CI 全綠、合進 `develop` `3a39a17`；家裡平放的 8 份刪了，VM 上的留著；guard 32、limit-guard 52；上一個專案的工作目錄、分支、worktree 前後相同） |
| 7 審查 | `/matt-code-review`：這個 repo `main...claude/legacy-to-home`＋客廳這一輪的 commit＋上一個專案新增的 `project.json` | xhigh | ✅ 10/29：結果在「段 7 審查結果」（12 條＋9 條判斷題；照規矩沒修）；測試全過、mods 兩份相同、上一個專案 develop 的 CI 綠。**要使用者決定的段 7 三題，開段 8 之前先問第 1、2 題** |
| 8 收尾（一）guard 與文件 | 段 7 第 6、7、10 條（guard；第 7 條含段 1 中途發現 2「`project.json` 壞掉」，照段 7 第 1 題的答案）、第 3、4、9、12 條（換行、文件、註解）、第 2 條（照段 7 第 2 題的答案改上一個專案的記憶與 `.local/README.md`） | high | ✅ 前半第 6、7、10 條（客廳 `9529bce`、`32923b0`、`f264938`；guard 33→38 全過、tsc 0 錯、validate 過、兩份 mods 相同；額度 86% 停下）；續：第 3 條（客廳 `4324caf`）、第 4、9、12 條（客廳 `3d13dec`）、第 2 條（上一個專案的記憶與 `.local/README.md`，它的 `.local` `2ca53a6` 已推）。guard 38、limit-guard 52 全過、limit-guard tsc 0 錯、validate 過、兩份 mods 逐檔相同 |
| 9 收尾（二）同步、儀表板、PR | 段 5 中途發現 1（客廳 `.local` 推之前 `pull --rebase`，紅燈先）、段 7 第 8 條（`--check-mods` 改成「這台改的推上去了」，紅燈先；跟段 5 中途發現 1 同在 `autosync.mjs`／`devbox.mjs`）、第 11 條要不要順手（`vm/README.md` 一句）、段 2 中途發現 1（dash 總覽「新對話會用 X」改成比 email，要截圖）、手動檢查清單、PR、合併 | xhigh（兩台同時寫 git 的測試、devbox 流程） | ✅ 10/29：[PR #6](https://github.com/b09901017/baobuverse-kingdom/pull/6)（說明含手動檢查清單）用 merge commit 合進 `main`（`91f5952`；這個 repo 沒有 CI，照 CLAUDE.md 以驗證全過、沒有衝突為準）。四條做完：段 5 中途發現 1（客廳 `7345fbf`）、段 7 第 8 條（客廳 `360a313`；`mods.test.mjs:128` 主控照 A）、第 11 條（客廳 `1da2f16`）、段 2 中途發現 1（客廳 `0a3c7cd`）。這個 repo `81d14f5`、`e7b1901`、`6f269b5`、`a5a6319`。最後一支一支跑：guard 38、limit-guard 52、dash 38、e2e-progress 5、notify 6；客廳 autosync 19、mods 13、devbox 14、devbox-mods 22，全過。總覽截圖 10/29 過了（不同 email 那一種；同 email 靠測試）。**第 3 階段這一輪結束**；這一筆（PR 連結、合併 commit）是合併之後才 commit 在分支上的，跟上一輪一樣隨下一輪的 PR 進 `main` |

段 7 建議把原本的段 8 拆成兩段（guard 與文件／同步與儀表板）：段 7 多找到 4 條要改程式的，跟原本 3 條加起來分在 guard、客廳 autosync／devbox、dash 三處，一段做完會很長。兩段改的檔不重疊。**主控開段 8 之前先跟使用者說這個拆法。**

## 下一輪要做的（第 3 階段留下的）

| 哪一條 | 要做的 | 備註 |
|---|---|---|
| 段 1 中途發現 1、段 8 中途發現 2、5 | guard 每一種指令（firebase CLI、Firestore REST、`neverWrite` 的 `git push`／`gh`／`gcloud`）都只看「一段指令的開頭」，跳過 heredoc 內文與引號裡的字 | 只是多問；修好之前寫這類測試字串先跟使用者說「會跳框」 |
| 段 8 中途發現 4 | `project.json` 合法但 `neverWrite` 壞掉（不是陣列、某一項沒有 `firebaseProject`／`gitRepo`）也當成讀不懂 | 只會多問 |
| 判斷題 J1 | autosync 加「推不上就 exit 1」的模式，devbox 只看 exit code，拿掉 devbox 自己的兩份「`.local` 推完了沒」 | 段 9 照 J1 沒加第三套 |
| 判斷題 J2～J8 | `--no-home` 改名 `--no-mods`（J2）、autosync 開頭算一次 mode（J3）、limit-guard 與 dash 認帳號的寫法加一條測試釘住一致（J4）、`mainDir`／`worktreeOf` 兩處（J5）、`vm-state.json` 的 `'ok'`／`'none'`／`'bad'`（J6）、dash `devboxScript` 的命名與寫死的退路路徑（J7）、客廳測試小工具抽 `tools/test-helpers.mjs`（J8） | 異味，不擋 |
| 段 4 中途發現 1 | 儀表板帶的 `--project` 是 worktree 時，`checkProjectArg` 改成看主資料夾（不再多印一行「還沒加進 VM 的清單」） | 不急 |
| 段 6 中途發現 1 | dash「雲端」分頁的標題讀客廳 `vm/devbox.json` 的 `instance`，不寫死 | 畫面的字會變，要截圖 |
| 段 9 中途發現 1 | 回家的家裡那一半 `pullLocal` 也 `pull --rebase --autostash`、衝突就 abort 停 | 很少碰到 |
| spec 第 7 題 | 刪上一個專案 `.local/tools/` 的舊工具與 `.local/claude-mods/` | 記憶與 `.local/README.md` 已經寫「不要再叫」（段 8） |
| spec 第 2 題、「不做」 | 上一個專案的 skill 換成客廳的版本（先看差異）；E2E 加速的 skill | |
| 段 2 中途發現 2、段 8 中途發現 1、6 | 記進 `docs/agents/lessons.md`：測試裡 `$` 不能直接叫模組的函式；Bash heredoc 把 `\\` 變 `\`；`$(…)` 裡有 `$'…'` 報錯但前半已經跑了、awk 會把 CRLF 變 LF | 可以考慮 |

## 每一段共同的規矩

- 動工前讀：這份、`spec.md`、這一段的 issue、`CLAUDE.md`、`docs/agents/lessons.md`；前面幾支 issue 底下的「做完時留下的」
- 一支 issue 一個 commit（這個 repo）；`Status:` 改 `done`，issue 底下寫「做完時留下的」（實際做成什麼樣子、跟 issue 寫的不同的地方）
- **改 `~/.claude/mods`**：既有測試一條都不改就要全過、新行為先寫紅燈測試再修到綠、tsc 0 錯（`npx -y -p typescript@5 tsc -p <mod 資料夾> --noEmit`；notify 沒有 tsconfig 不跑）、
  `claude plugin validate <mod 資料夾>` 過；改完複製進客廳 `mods/`、客廳 commit、推；客廳 `mods/` 跟 `~/.claude/mods` 逐檔相同。
  客廳的自動同步可能先把改到一半的檔備份成「自動同步」commit：**最後一個 commit 的狀態完整就好**（spec 第 6 題）。
- 測試一支一支跑，不要平行全開（使用者的電腦曾經過熱斷電）。客廳的 node 測試寫檔名跑：`node --test tools/devbox.test.mjs`、`node --test tools/autosync.test.mjs`（**不要** `node --test tools/`）。
  基準（2026-10-29）：dash 27、e2e-progress 5、guard 24、limit-guard 30、notify 6；客廳 autosync 12、devbox 18。
  段 3 之後客廳：`autosync.test.mjs` 14、`mods.test.mjs` 12、`devbox.test.mjs` 14（照 A 刪了 4 條）、`devbox-mods.test.mjs` 15，四支都寫檔名一支一支跑。
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

## 段 3 的開場

建議 effort：**xhigh**。開段前主控先跟使用者說：**段 3 做完到段 5 做完之間，不要按出門／回家**（客廳的工具存檔就生效）。
03 的截圖 10/29 過了（段 2 已把 03 改 done）。

```
這一輪是「第 3 階段」：上一個專案改用客廳的工具，拿掉所有寫死它的特例。分支 claude/legacy-to-home（已經在這個 checkout 上）。
段 1 做完 issue 01（guard 的特例變成資料、沒有 project.json 用最嚴預設）、07（規則文件）。
段 2 做完 issue 02（limit-guard：已用 < 20% 時速度要取樣夠長、「其他帳號」以 email 為單位；這個 repo 01e946d、客廳 8419bac）、
03（儀表板帳號頁一個 email 一張卡、另一個帳號可以切；7179dc9、客廳 06369c8；截圖過了）。
這是第 3 段：只做 issue 04（客廳的出門／回家：上一個專案走通用流程、.local 整個同步、mods 改從客廳搬、基準點、VM 的 unit 與步驟只改客廳的檔）。不做其他的，不開 VM。

先讀：.scratch/legacy-to-home/HANDOFF.md 的「每一段共同的規矩」「過目抓到的」（第 1、2、3、5、10 條是 04 的）、「中途發現」「要使用者做的」；
spec.md（「之後的樣子」「換手的順序」「使用者選的答案」第 5、6、7 題、「上一個專案一律不能壞」「行為會變的」）；issues/04 全文（「動工前先讀」列的檔都要讀）；
issues/01、02、03、07 底下「做完時留下的」；CLAUDE.md；docs/agents/lessons.md（第一條：「回家」把家裡切到 VM 的舊分支）；
.scratch/claude-home-workflow/HANDOFF.md「段 6 審查結果」② ③ ⑦ 與「段 7 狀態」。動工前 git -C C:/Users/DELL/claude-home pull --ff-only。

要特別注意：
- 先做對照表（上一個專案 .local/tools/devbox/devbox.mjs 的出門、回家、VM 關著時的回家，每一步 vs 客廳通用流程），表寫進 04 的「做完時留下的」，再動程式。少的步驟照 project.json／devbox.json 的資料補，不寫死。
- 基準點（過目抓到的第 2 條）：上游的 mods/ 在這台上次同步之後被改過、這台還沒還原 → 不備份、只寫 log。任何一步失敗整個停（set -eo pipefail），不印 ✅。
- devbox-presync 停用要寫成「drop-in 把 ExecStop 換成 /bin/true、daemon-reload、再 disable」（過目抓到的第 5 條）；VM 上的實際改動在 issue 08，這一段只改客廳 vm/ 的檔與 README。
- 測試用假的 ssh（devbox.test.mjs 現有做法）；客廳 node 測試寫檔名一支一支跑：node --test tools/devbox.test.mjs、node --test tools/autosync.test.mjs（不要 node --test tools/）。基準 autosync 12、devbox 18。
- --dry-run 不是唯讀（會改 .local 與客廳 mods/ 的工作目錄）：對上一個專案要試就在暫存資料夾的複本上試。
- 客廳 vm/devbox.json 是私人值：照實改，值不要印出來、不要抄進公開 repo。
- 上一個專案 C:/Users/DELL/Desktop/baobao-wellness-clinic-scheduler 的檔案只讀不改（.local/tools/ 一個都不改）；它的 .local/references/ 不讀。公開 repo 不帶真名、帳號、email、金鑰、VM host／GCP id。
- 改 ~/.claude/mods 或客廳的規矩照 HANDOFF「每一段共同的規矩」；客廳那邊最後一個 commit 狀態完整就算數，這個 repo 一支 issue 一個 commit。改任何函式或文件裡的字之前 grep 所有用到它的地方。
- 推私人 repo、改 ~/.claude/settings.json 被 auto mode 擋下就停，寫進 HANDOFF，不要繞。會「少問」的停下來問主控。中途發現的事記進 HANDOFF，不岔出去修。subagent 一次最多兩個。
- 主控會開下一段：不要自己開 session，也不要存 limit-guard 的開場 JSON。

做完要交：一個 commit（這個 repo 推到 origin claude/legacy-to-home；客廳推到它的 main）、Status: done、issue 04 底下「做完時留下的」（含對照表）、
HANDOFF 更新（狀態、中途發現、要使用者決定的）、段 4 的開場與建議 effort 寫進 HANDOFF（段 4 開段前主控要問使用者：上一個專案有沒有開著的對話）。
最後回覆用繁體中文簡短說做了什麼、卡在哪。
```

## 段 4 的開場

建議 effort：**high**。開段前主控先問使用者：**上一個專案現在有沒有開著的對話**（有的話它的 hook 還是舊的；05 規矩）。

```
這一輪是「第 3 階段」：上一個專案改用客廳的工具，拿掉所有寫死它的特例。分支 claude/legacy-to-home（已經在這個 checkout 上）。
段 1 做完 issue 01（guard）、07（規則文件）；段 2 做完 02（limit-guard）、03（儀表板帳號頁）。
段 3 做完 issue 04（客廳 d7f980c）：上一個專案成了 vm/devbox.json projects 的一列、devbox.mjs 拿掉 legacy；客廳 autosync 把 .local 整個 commit；
mods 的正本在客廳，換手時 devbox 叫 autosync --restore-mods／--check-mods，備份照「基準點」（另一台改過、這台還沒接回來就只寫 log）。
這是第 4 段：只做 issue 05（換手：平放的開場先複製進子資料夾、儀表板一律叫客廳的 devbox、全域 hook 換成客廳的同步、這個 repo 的專案 hook 拿掉、limit-guard 拿掉 FLAT_PROJECTS）。不做其他的，不開 VM。

先讀：.scratch/legacy-to-home/HANDOFF.md 的「每一段共同的規矩」「過目抓到的」（第 1、7 條是 05 的）、「中途發現」段 3、「要使用者做的」；
spec.md（「換手的順序」「上一個專案一律不能壞」「允許改的既有測試」）；issues/05 全文（「動工前先讀」列的檔都要讀）；
issues/04 底下「做完時留下的」（對照表、autosync 的新旗標 --mods／--no-home／--restore-mods／--check-mods、基準點）；CLAUDE.md；docs/agents/lessons.md。
動工前 git -C C:/Users/DELL/claude-home pull --ff-only。

要特別注意：
- 全域 hook 改叫客廳的 autosync（--project "${CLAUDE_PROJECT_DIR}"）之後，每個資料夾的對話開始／結束都會做 mods 那一半（照基準點）與那個專案的 .local（整個）。
  家裡這台現在還沒有基準點（~/.claude/mods-data/claude-home-mods-base）：第一次對話開始／結束時 Windows 照舊備份並記下（mods 跟客廳一樣，不會多 commit）。
- 改 ~/.claude/settings.json（與客廳 settings/settings.json、settings/README.md）可能被 auto mode 擋：被擋就停，把要使用者做的一步一步寫進 HANDOFF「要使用者做的」，不要繞。
- 05 做法 7（暫存資料夾的複本上對上一個專案跑客廳的同步）：上一個專案 .local 有很長的路徑，clone 要 git -c core.longpaths=true，錯誤導到檔案只算行數（段 3 中途發現 1）；
  記憶要對得到複本路徑，用一個暫存的 CLAUDE_CONFIG_DIR 放 projects/<複本路徑代號>/memory（段 3 中途發現 4）。它的 .local/references/ 不讀。
- 改 ~/.claude/mods（limit-guard、dash）的規矩照 HANDOFF「每一段共同的規矩」；允許改的既有測試只有 spec 列的；會「少問」的停下來問主控。
- 上一個專案 C:/Users/DELL/Desktop/baobao-wellness-clinic-scheduler 的檔案只讀不改（.local/tools/ 一個都不改）。公開 repo 不帶真名、帳號、email、金鑰、VM host／GCP id。
- 改任何函式或文件裡的字之前 grep 所有用到它的地方。中途發現的事記進 HANDOFF，不岔出去修。subagent 一次最多兩個。
- 主控會開下一段：不要自己開 session，也不要存 limit-guard 的開場 JSON。判準 1、2、5 要真的開關對話：請主控開（05 規矩）。

做完要交：一個 commit（這個 repo 推到 origin claude/legacy-to-home；客廳推到它的 main）、Status: done、issue 05 底下「做完時留下的」、
HANDOFF 更新（狀態、中途發現、要使用者做的／決定的）、段 5 的開場與建議 effort 寫進 HANDOFF（段 5 要開 VM，緊接段 4）。最後回覆用繁體中文簡短說做了什麼、卡在哪。
```

## 段 5 的開場

建議 effort：**high**。緊接段 4。開段前主控先跟使用者說：**這一段會開 VM（花錢，使用者已同意一次），用完關機**。

```
這一輪是「第 3 階段」：上一個專案改用客廳的工具，拿掉所有寫死它的特例。分支 claude/legacy-to-home（已經在這個 checkout 上）。
段 1～3 做完 issue 01、07、02、03、04；段 4 做完 issue 05（家裡的換手：全域 hook 叫客廳的 autosync --project ${CLAUDE_PROJECT_DIR}、這個 repo 的專案 hook 拿掉、
儀表板一律叫客廳的 devbox、limit-guard 拿掉 FLAT_PROJECTS（worktree 一律主資料夾名）、平放的 8 份開場複製進 handoffs/baobao-wellness-clinic-scheduler/、客廳 autosync 在 worktree 照主資料夾同步）。
這是第 5 段：只做 issue 08（開 VM 走一次出門／回家，把 VM 那一半換完）。不做其他的。

先讀：.scratch/legacy-to-home/HANDOFF.md 的「每一段共同的規矩」「中途發現」段 3（第 3、5 條是 08 的）與段 4、「要使用者做的」；
spec.md（「換手的順序」第 4 步、「使用者選的答案」第 5、7 題、「上一個專案一律不能壞」）；issues/08 全文（「動工前先讀」列的檔都要讀）；
issues/04、05 底下「做完時留下的」（04 的對照表、05 的全域 hook 寫法）；客廳 vm/README.md「第 3 階段換手」；CLAUDE.md；docs/agents/lessons.md（第一條）。
動工前 git -C C:/Users/DELL/claude-home pull --ff-only。

要特別注意：
- 開 VM 之前：記下家裡每個專案的分支與 git status；確認客廳、兩個 .local 都推上去了；在對話裡說一聲要開 VM 了。連不上（Tailscale 沒開等）就停，寫進 HANDOFF。
- 出門之後、VM 上**任何對話開始之前**，照客廳 vm/README.md「第 3 階段換手」1→5 做：devbox-presync 先 drop-in 把 ExecStop 換成 /bin/true、daemon-reload、確認、再 disable（不要 disable --now）；
  VM 的全域 hook 換成客廳的（exec 形式，跟家裡客廳 settings/settings.json 同一種寫法，路徑換 VM 的）；VM 上平放的開場**複製**（不搬）進 handoffs/baobao-wellness-clinic-scheduler/；
  客廳 pull、重裝 claude-home-presync.service；不要對上一個專案跑 add-project.sh。改 VM 的 ~/.claude/settings.json 被擋就停、寫進 HANDOFF。
- 段 3 中途發現 5：devbox-presync 停用一定要在 VM 關機之前。關機後下次開 VM 時看 journalctl -u claude-home-presync -b -1 實際幾秒（段 3 中途發現 3；這次沒有下次就留給之後）。
- 回家之後：家裡每個專案的分支跟開 VM 前記下的一樣（lessons 第一條）；devbox.mjs status 是「關著」。
- VM 的 host、GCP 專案 id、zone 是私人值：不寫進這個 repo（commit、.scratch、PR）。不替使用者答 workspace trust、不放金鑰或 ADC 到 VM。
- 改 ~/.claude/mods 或客廳的規矩照 HANDOFF「每一段共同的規矩」。中途發現的事記進 HANDOFF，不岔出去修。subagent 一次最多兩個。
- 主控會開下一段：不要自己開 session，也不要存 limit-guard 的開場 JSON。

做完要交：一個 commit（這個 repo 推到 origin claude/legacy-to-home；客廳有改就推它的 main）、Status: done、issue 08 底下「做完時留下的」、
HANDOFF 更新（狀態、中途發現、要使用者做的／決定的）、段 6 的開場與建議 effort 寫進 HANDOFF。最後回覆用繁體中文簡短說做了什麼、卡在哪。
```

## 段 6 的開場

建議 effort：**high**。開段前主控先問使用者「要使用者決定的」段 5 第 1 題（段 5 中途發現 1 什麼時候修；建議段 8）；答案寫進這個開場的「主控補充」再開。段 6 不開 VM。
→ 使用者 10/29 選「段 8 修（建議）」，下面那一條已改好。

```
這一輪是「第 3 階段」：上一個專案改用客廳的工具，拿掉所有寫死它的特例。分支 claude/legacy-to-home（已經在這個 checkout 上）。
段 1～4 做完 issue 01、07、02、03、04、05；段 5 做完 issue 08（10/29 開 VM 一次：devbox-presync 停用（drop-in＋disable）、VM 的全域 hook 換成客廳的、
VM 平放的開場複製進子資料夾、客廳 pull、unit 重裝；出門後 VM 跟家裡一樣、回家後家裡分支沒變；VM 已關機）。VM 那一半換完了，VM 上已經沒有東西會叫舊的 sync-claude。
這是第 6 段：只做 issue 06（上一個專案加 .claude/project.json、刪家裡平放的開場、把剩下寫死它的地方收乾淨、legacy-parity 加一組）。不做其他的，不開 VM。

先讀：.scratch/legacy-to-home/HANDOFF.md 的「每一段共同的規矩」「過目抓到的」（第 4、11 條是 06 的）、「中途發現」段 5 與段 4、「要使用者做的」「要使用者決定的」；
spec.md（「換手的順序」第 5 步、「使用者選的答案」第 1、2 題、「上一個專案一律不能壞」「允許改的既有測試」）；issues/06 全文（「動工前先讀」列的檔都要讀，含上一個專案的 CLAUDE.md、.firebaserc）；
issues/01、04、05、08 底下「做完時留下的」；CLAUDE.md；docs/agents/lessons.md。動工前 git -C C:/Users/DELL/claude-home pull --ff-only。

要特別注意：
- 上一個專案 C:/Users/DELL/Desktop/baobao-wellness-clinic-scheduler 的工作目錄、目前分支（claude/availability-sheet-chart-no）、10 個 worktree 都不動：在 scratchpad 另外 clone（短路徑、git -c core.longpaths=true，錯誤導到檔案只算行數；它的 .local/references/ 不讀），
  從它的基底分支開分支，只新增 .claude/project.json（值＝最嚴預設、不寫 skills）。照它自己的 CLAUDE.md 開 PR、合併；做完對一次它的分支與 worktree list 跟做之前一樣。
- 刪平放的開場：只刪家裡 ~/.claude/mods-data/handoffs/ 第一層那 8 份（子資料夾有一樣的，刪前逐檔 cmp）。VM 上那 8 份留著（要開 VM；HANDOFF「要使用者做的」下次開 VM 時刪）。
- 收乾淨的 grep 照 06 判準列的範圍；vm/existing/ 與測試的假資料可以留名字。客廳文件裡「第 3 階段換手」那一節是 VM 重建時要照做的，改寫成「已經做完」但步驟留著。
- 段 5 中途發現 1（兩台同時寫 .local，VM 關機時推不上去）不在這一段修：使用者 10/29 選段 8 修。這一段不按「出門」（修好之前會停在這個專案）。
- 改 ~/.claude/mods 或客廳的規矩照 HANDOFF「每一段共同的規矩」；允許改的既有測試只有 spec 列的；會「少問」的停下來問主控。改任何函式或文件裡的字之前 grep 所有用到它的地方。
- 推私人 repo、改 ~/.claude/settings.json 被 auto mode 擋下就停，寫進 HANDOFF，不要繞。中途發現的事記進 HANDOFF，不岔出去修。subagent 一次最多兩個。
- 公開 repo 不帶真名、帳號、email、金鑰、VM host／GCP id。主控會開下一段：不要自己開 session，也不要存 limit-guard 的開場 JSON。

做完要交：這個 repo 一個 commit（推到 origin claude/legacy-to-home；客廳推它的 main；上一個專案照它的規定 PR、合併）、Status: done、issue 06 底下「做完時留下的」、
HANDOFF 更新（狀態、中途發現、要使用者做的／決定的）、段 7（審查）的開場與建議 effort 寫進 HANDOFF。最後回覆用繁體中文簡短說做了什麼、卡在哪。
```

## 段 7 的開場

建議 effort：**xhigh**（審查單獨一段）。段 7 不開 VM、不按出門／回家（段 5 中途發現 1 段 8 才修）。
主控開段時另外補了三項（2026-10-29）：VM 的四個私人值對這個分支每個 commit 與 `.scratch` 比一次（不印值）；客廳 `e5c6240` 不在範圍；看上一個專案 develop 合併後「測試與部署」的結果。結果都在「段 7 審查結果」。

```
這一輪是「第 3 階段」：上一個專案改用客廳的工具，拿掉所有寫死它的特例。分支 claude/legacy-to-home（已經在這個 checkout 上）。
段 1～6 做完 issue 01、07、02、03、04、05、08、06（全部 Status: done）。段 6：上一個專案加了 .claude/project.json（值＝最嚴預設、不寫 skills；
它的 PR b09901017/baobao-wellness-clinic-scheduler#186 合進 develop）、家裡平放的 8 份開場刪了（VM 上的留著）、客廳文件與 limit-guard 一行註解收乾淨、legacy-parity 加一組（客廳 8139692）。
這是第 7 段：審查。只審查、不修：找到的寫進 HANDOFF「段 7 審查結果」，段 8 修。

先讀：.scratch/legacy-to-home/HANDOFF.md 的「每一段共同的規矩」「過目抓到的」「中途發現」（段 1～6）「使用者已經決定的」；spec.md 全文（「允許改的既有測試」「行為會變的」「上一個專案一律不能壞」）；
issues/ 八支全文與底下「做完時留下的」；CLAUDE.md；docs/agents/lessons.md。動工前 git -C C:/Users/DELL/claude-home pull --ff-only。

審查範圍（/matt-code-review，Standards＋Spec 兩軸）：
- 這個 repo：main...claude/legacy-to-home
- 客廳 C:/Users/DELL/claude-home：881473b..8139692（這一輪 12 個 commit，含自動同步的 807bc91、7e375d5；之後如果多了自動同步的 commit，看最後的狀態）
- 上一個專案：只有 develop 上新增的 .claude/project.json（PR #186）；它的工作目錄、分支、worktree 不動，它的 .local/references/ 不讀

要特別注意：
- Spec 那一軸：每支 issue 的判準有沒有真的做到；「允許改的既有測試」以外有沒有改到既有測試（拿 881473b 跟 8139692 比 mods/*/tests 與 tools/*.test.mjs）；會「少問」的地方（guard 的 STRICT、project.json 壞掉時——段 1 中途發現 2 已排段 8）。
- 換手的安全：舊的 sync-claude 還有沒有任何路徑會被叫到（家裡三份 settings.json、儀表板、VM 的說明）；mods 的基準點；.local 整個同步會不會推到不該推的（references/ 是她的規定，要推）。
- 測試一支一支跑（電腦曾過熱斷電）：guard 32、limit-guard 52、dash 34、e2e-progress 5、notify 6；客廳 node --test tools/autosync.test.mjs 16、tools/mods.test.mjs 12、tools/devbox.test.mjs 14、tools/devbox-mods.test.mjs 15（寫檔名，不要 node --test tools/）。
- subagent 一次最多兩個（matt-code-review 的兩軸剛好兩個）。公開 repo 不帶真名、帳號、email、金鑰、VM host／GCP id。
- 主控會開下一段：不要自己開 session，也不要存 limit-guard 的開場 JSON。

做完要交：HANDOFF「段 7 審查結果」（每一條：哪裡、什麼情境會錯、建議、要不要使用者決定）、分段表段 7 狀態、段 8 的開場與建議 effort（段 8 要修的已列在分段表：審查找到的＋段 1 中途發現 2、段 2 中途發現 1、段 5 中途發現 1）。
這個 repo 一個 commit 推到 origin claude/legacy-to-home。要使用者決定的一次一題、附建議，寫進「要使用者決定的」段 7。最後回覆用繁體中文簡短說找到什麼、卡在哪。
```

## 段 8 的開場

建議 effort：**high**。開段前主控先：① 跟使用者說段 8 拆成兩段（分段表）；② 問「要使用者決定的」段 7 第 1、2 題，答案寫進開場的「主控補充」再開（第 3 題不擋段 8）。段 8 不開 VM、不按出門／回家。

```
這一輪是「第 3 階段」：上一個專案改用客廳的工具，拿掉所有寫死它的特例。分支 claude/legacy-to-home（已經在這個 checkout 上）。
段 1～6 做完 issue 01～08；段 7 審查完（HANDOFF「段 7 審查結果」12 條＋判斷題 J1～J9）。原本的收尾拆成兩段：
這是第 8 段（收尾一）：只修 guard 與文件，加上上一個專案記憶裡的舊說明。段 9 的（客廳 autosync／devbox、dash、PR、合併）不做。

先讀：.scratch/legacy-to-home/HANDOFF.md 的「每一段共同的規矩」「段 7 審查結果」（全文）、「要使用者決定的」段 7（含答案）、「使用者已經決定的」、「中途發現」段 1；
spec.md「允許改的既有測試」「行為會變的」；issues/01、06 底下「做完時留下的」；CLAUDE.md；docs/agents/lessons.md；客廳 docs/project-config.md。
動工前 git -C C:/Users/DELL/claude-home pull --ff-only。

要修的（照這個順序）：
1. 段 7 第 6 條（guard 少問）：先把 node scripts/reset-staging.mjs --project <正式站 id>、npm run staging:reset -- --project <正式站 id>
   加進 mods/guard/tests/fixtures/parity-cases.ts（legacy-parity 讀不到 .firebaserc 那條會紅），再改 classify.ts：指令自己寫了 --project／-P 卻認不出時，不套 stagingScripts／prodReadScripts 的推定。
2. 段 7 第 7 條（project.json 壞掉，含段 1 中途發現 2）：照段 7 第 1 題的答案（主控補充）。紅燈先：不是 JSON、[]、null × 這個 repo neverWrite 那條 gcloud 指令、推別的 repo。
   會改 project-config.test.ts:112 的意思：先寫進 spec「允許改的既有測試」（使用者 10/29 選段 8 修時就說好的）。
3. 段 7 第 10 條：firebase use default 照 .firebaserc 的別名認（紅燈先）；照第 1 題的答案把「firebase use <認不出的專案> 要問」寫進 spec「行為會變的」。
4. 段 7 第 3 條：客廳 mods/guard/tests/guard.test.ts 換回 CRLF（只改換行；改完 git -C <客廳> diff 881473b -- mods/guard/tests/guard.test.ts 只剩一行），~/.claude/mods 那份一起。
5. 文件與註解：段 7 第 4 條（客廳 docs/project-config.md 的 prodReadScripts 補「前後是字的邊界就算」，不改比對方式）、第 9 條（客廳 README「新電腦怎麼接」把 --restore-mods 排到裝 hook 之前）、
   第 12 條（limit-guard tests/handoff-dir.test.ts:8 那一行說明，不動斷言）。
6. 段 7 第 2 條：照段 7 第 2 題的答案（主控補充）。上一個專案的記憶用 grep -l 找檔、不要 grep -n 印整行（裡面有 VM 的私人值，段 7 第 5 條）；
   它的 .local/README.md 只改那三段的說明，.local/tools/ 一個都不改，.local/references/ 不讀。

要特別注意：
- 改 ~/.claude/mods 的規矩照 HANDOFF「每一段共同的規矩」（既有測試只改 spec 列的、紅燈先、tsc、validate、複製進客廳、推、客廳 mods/ 跟 ~/.claude/mods 逐檔相同）。
  guard 的改動全部要是「多問」；哪一條會少問，停下來問主控。改任何函式或文件裡的字之前 grep 所有用到它的地方。
- guard 會把指令字串裡的 firebase CLI 字樣當成指令（段 1 中途發現 1，下一輪修）：被跳框問時照實說明，不要改寫法繞。
- 測試一支一支跑（電腦曾過熱斷電）：guard（32＋新的）、limit-guard 52。這段不改客廳 tools/，客廳的 node 測試不用跑。
- 公開 repo 不帶真名、帳號、email、金鑰、VM host／GCP 專案 id／zone／VM 的 instance 名。
- 中途發現記進 HANDOFF，不岔出去修。subagent 一次最多兩個。主控會開下一段：不要自己開 session，也不要存 limit-guard 的開場 JSON。

做完要交：這個 repo 一個 commit（推到 origin claude/legacy-to-home；客廳推它的 main）、HANDOFF「段 7 審查結果」修了的每一條標 ✅ 與 commit、spec 改了什麼寫清楚、
HANDOFF 更新（狀態、中途發現、要使用者決定的）、段 9 的開場與建議 effort（段 9 的範圍見分段表）。最後回覆用繁體中文簡短說做了什麼、卡在哪。
```

## 段 8 續的開場

建議 effort：**medium**（剩下的都是換行、文件、記憶的字；guard 的程式不動）。段 8 做到第 6、7、10 條（guard），額度 86% 停下。主控照這份開，跟段 8 的開場同一套規矩。

```
這一輪是「第 3 階段」：上一個專案改用客廳的工具，拿掉所有寫死它的特例。分支 claude/legacy-to-home（已經在這個 checkout 上）。
這是第 8 段的後半（收尾一續）：段 8 前半做完段 7 審查第 6、7、10 條（guard，客廳 9529bce、32923b0、f264938；guard 38 條全過）。
這一段只做剩下的：換行、文件、註解、上一個專案記憶的舊說明。不改 guard 的程式；段 9 的（客廳 autosync／devbox、dash、PR、合併）不做。

先讀：.scratch/legacy-to-home/HANDOFF.md 的「每一段共同的規矩」「段 7 審查結果」第 2、3、4、9、12 條、「要使用者決定的」段 7 第 2 題（含答案）、「中途發現」段 8；
CLAUDE.md；docs/agents/lessons.md。動工前 git -C C:/Users/DELL/claude-home pull --ff-only。

要修的（照這個順序；每修完一條就在這個 repo 與客廳各 commit、推，HANDOFF 那一條標 ✅ 與 commit）：
1. 段 7 第 3 條：客廳 mods/guard/tests/guard.test.ts 換回 CRLF（只改換行），~/.claude/mods 那份一起。
   改完 git -C <客廳> diff 881473b -- mods/guard/tests/guard.test.ts 只剩一行（:30／:32 那一行）。客廳 .gitattributes／core.autocrlf 先看一下，免得 commit 時又被換回 LF。
   guard 測試跑一次（38 條）。
2. 文件與註解：段 7 第 4 條（客廳 docs/project-config.md 的 prodReadScripts 那一列補「檔名前後是字的邊界就算，例如 dry-run.mjs 也算 run.mjs」，不改比對方式；
   同一列段 8 前半已經補了「--project 認不出時不推定」，不要重複）、第 9 條（客廳 README「新電腦怎麼接」把 --restore-mods 排到裝全域 hook 之前，只改文件）、
   第 12 條（limit-guard tests/handoff-dir.test.ts:8 那一行說明改成跟程式一樣：照舊也讀第一層，不動斷言；limit-guard 測試跑一次 52 條、tsc、validate、複製進客廳）。
3. 段 7 第 2 條：照段 7 第 2 題的答案（使用者「改（建議）」）。上一個專案（C:/Users/DELL/Desktop/baobao-wellness-clinic-scheduler）的記憶
   cloud-vm-devbox-2026-10-21.md、private-local-repo.md 各加一行「2026-10-29 起換成客廳的工具（儀表板「雲端」分頁或 <客廳>/tools/devbox.mjs）；.local/tools/ 的舊工具不要再叫，--restore 會把舊 mods 蓋回來」，
   它的 MEMORY.md 那兩行的說明跟著改；它的 .local/README.md 的 D 段、「自動更新」「手動更新」三段各加同一句。
   記憶用 grep -l 找檔、不要 grep -n 印整行（裡面有 VM 的私人值，段 7 第 5 條）；要看內容只挑沒有私人值的那幾行。.local/tools/ 一個都不改，.local/references/ 不讀。
   這些檔有版控，客廳的自動同步會推進它的私人 repo；推私人 repo 被擋就停、寫進 HANDOFF。

要特別注意：
- 改 ~/.claude/mods 的規矩照 HANDOFF「每一段共同的規矩」。測試一支一支跑（電腦曾過熱斷電）：guard 38、limit-guard 52。客廳 tools/ 不改，客廳的 node 測試不用跑。
- 這個環境的 Bash heredoc 會把 \\ 變成 \（段 8 中途發現 1）：要寫反斜線的檔用 Write／Edit，不要用 heredoc 餵 python。
- guard 會把指令字串裡的 firebase CLI、firestore 網址、neverWrite 的 git push／gh／gcloud 當成指令，heredoc 內文也算（段 1 中途發現 1、段 8 中途發現 2、5，下一輪修）：
  被跳框或被記成「碰了 Firebase」時照實說明，不要改寫法繞。要在指令裡寫這類測試字串之前，先在對話裡跟使用者說「等一下會跳框，是測試字串」。
- 公開 repo 不帶真名、帳號、email、金鑰、VM host／GCP 專案 id／zone／VM 的 instance 名。
- 中途發現記進 HANDOFF，不岔出去修。subagent 一次最多兩個。主控會開下一段：不要自己開 session，也不要存 limit-guard 的開場 JSON。

做完要交：分段表段 8 標 ✅、「段 7 審查結果」修了的每一條標 ✅ 與 commit、HANDOFF 更新（狀態、中途發現、要使用者決定的）、
段 9 的開場與建議 effort（段 9 的範圍見分段表；建議 xhigh）。最後回覆用繁體中文簡短說做了什麼、卡在哪。
```

## 段 9 的開場

建議 effort：**xhigh**（兩台同時寫 git 的紅燈測試、devbox 流程、PR 與合併）。段 8 全部做完（分段表）。段 9 不開 VM、不按出門／回家（修好之前「出門」會停，見段 5 中途發現 1）。
開段前主控看 5 小時額度；段 9 長，額度不夠就先做 1、2（同在客廳 `tools/`），dash 與 PR 留到「段 9 續」。

```
這一輪是「第 3 階段」：上一個專案改用客廳的工具，拿掉所有寫死它的特例。分支 claude/legacy-to-home（已經在這個 checkout 上）。
段 1～6 做完 issue 01～08；段 7 審查；段 8 修完段 7 第 2、3、4、6、7、9、10、12 條（guard、文件、上一個專案的記憶）。
這是第 9 段（收尾二，最後一段）：客廳 autosync／devbox 的兩條、dash 一行字、PR、合併。

先讀：.scratch/legacy-to-home/HANDOFF.md 的「每一段共同的規矩」「段 7 審查結果」第 8、11 條與判斷題 J1、「中途發現」段 5 第 1 條、段 2 第 1 條、段 8（全部）、
「要使用者決定的」段 5（含答案）、「使用者已經決定的」；spec.md「允許改的既有測試」「行為會變的」；issues/04、05 底下「做完時留下的」；
CLAUDE.md（合併：一輪做完開 PR，CI 綠了直接合）；docs/agents/lessons.md；客廳 README「自動同步」、vm/README.md。
動工前 git -C C:/Users/DELL/claude-home pull --ff-only。

要修的（照這個順序；每條這個 repo 與客廳各 commit、推，HANDOFF 那一條標 ✅ 與 commit）：
1. 段 5 中途發現 1（使用者 10/29「段 8 修（建議）」，拆段後在段 9）：客廳 autosync.mjs 的 commitAndPush 推之前 pull --rebase（.local 只有自動產生的檔），推失敗再 pull --rebase 重推一次；
   devbox.mjs out 的 VM 那一半 .local 改 pull --rebase。紅燈先：兩個 clone 各一個 commit 推同一個遠端（測試用暫存的 bare repo，不碰真的 .local）。
   判斷題 J1：不要順手加第三套「推完了沒」的檢查。
2. 段 7 第 8 條：autosync.mjs 的 checkModsNow（devbox.mjs 的 pushMods、vmMods、presyncMods 都靠它）改成「這台在基準點之後改過的檔都已經在 GitHub 上的客廳」——
   跟基準點一樣（沒改）或跟 @{u} 一樣都算過。紅燈先：VM 開著、家裡推了 mods、VM 沒改 → 回家照常關 VM、家裡接客廳那一份；VM 有改又沒推上去 → 照舊停。
   既有測試一條都不改；要改的先停、問主控（spec「允許改的既有測試」沒列的）。
3. 段 7 第 11 條（順手，只改文件）：客廳 vm/README.md 加一句「加進 devbox.json 的 projects 之前，先在 VM 上跑 add-project.sh」。
4. 段 2 中途發現 1：dash 總覽那行「新對話會用「X」」改成比 email（同一個 email 就不寫）。紅燈先；dash 測試一支跑（34＋新的）、tsc、validate、複製進客廳。
   畫面的字會變：改完停下來回報要截圖看哪一頁（總覽），主控請使用者在新對話點、截圖；截圖過了才開 PR。
5. PR：這個 repo claude/legacy-to-home → main，PR 內文用 /pr skill，附手動檢查清單（下次開 VM 時要做的，見 HANDOFF「要使用者做的」）。
   CI 綠了（或沒有 CI 時這一輪的驗證全過、沒有衝突）直接合進 main（CLAUDE.md）。客廳這一輪的 commit 已經在客廳 main 上，不另開 PR。

要特別注意：
- 測試一支一支跑（電腦曾過熱斷電），客廳寫檔名：node --test tools/autosync.test.mjs（16＋新的）、tools/devbox.test.mjs（14）、tools/mods.test.mjs（12）、tools/devbox-mods.test.mjs（15）；
  mods：guard 38、limit-guard 52、dash 34、e2e-progress 5、notify 6（最後各跑一次）。**不要** node --test tools/。
- 改 ~/.claude/mods 的規矩照 HANDOFF「每一段共同的規矩」。
- 這個環境的 Bash：heredoc 會把 \\ 變成 \（段 8 中途發現 1）；$(…) 裡有 $'…' 會報錯但前半已經跑了、awk 會把 CRLF 變 LF（段 8 中途發現 6）。要寫反斜線或改 CRLF 的檔用 Write／Edit 或 python 讀寫 bytes。
- guard 會把指令字串裡的 firebase CLI、firestore 網址、neverWrite 的 git push／gh／gcloud 當成指令，heredoc 內文也算（段 1 中途發現 1、段 8 中途發現 2、5，下一輪修）：
  被跳框時照實說明，不要改寫法繞；要在指令裡寫這類測試字串之前，先跟使用者說「等一下會跳框，是測試字串」。
- 公開 repo（commit、.scratch、PR）不帶真名、帳號、email、金鑰、VM host／GCP 專案 id／zone／VM 的 instance 名。
- 推私人 repo、改 settings.json 被擋就停、寫進 HANDOFF。中途發現記進 HANDOFF，不岔出去修。subagent 一次最多兩個。不要自己開 session，也不要存 limit-guard 的開場 JSON。

做完要交：分段表段 9 標 ✅（PR 連結、合併 commit）、修了的每一條標 ✅ 與 commit、HANDOFF 更新（狀態、中途發現、要使用者決定的、下一輪要做的：段 1 中途發現 1／段 8 中途發現 2、4、5、判斷題 J2～J8、段 4 中途發現 1、段 6 中途發現 1、上一個專案 .local/tools/ 的舊工具刪掉）。
最後回覆用繁體中文簡短說做了什麼、卡在哪。
```

## 段 7 審查結果（2026-10-29）

範圍：這個 repo `main...claude/legacy-to-home`（21 個 commit）、客廳 `881473b..8139692`（12 個）、上一個專案 PR #186 新增的 `.claude/project.json`。
`/matt-code-review` 兩軸各一個唯讀 subagent；換手安全、私人值、測試、上一個專案的 CI 由段 7 自己查。只審查、沒改任何程式。

### 驗證（一支一支跑）

| 項目 | 結果 |
|---|---|
| mods 測試 | guard 32、limit-guard 52、dash 34、e2e-progress 5、notify 6，全過（跟基準一樣多） |
| 客廳測試（寫檔名） | `autosync.test.mjs` 16、`mods.test.mjs` 12、`devbox.test.mjs` 14、`devbox-mods.test.mjs` 15，全過 |
| tsc | guard、limit-guard、dash 0 錯 |
| 客廳 `mods/` 跟 `~/.claude/mods` | 逐檔相同（不算 `node_modules`、`.claude-plugin/types`）；家裡的基準點＝客廳 `HEAD`＝`origin/main`（`e5c6240`） |
| 上一個專案 PR #186 | 只動 `.claude/project.json` 一個檔（+8）；內容跟 `legacy-parity.test.ts` 的複本逐字相同、值＝`STRICT`、沒寫 `skills`。合併後 `develop` 的「測試與部署」（重新部署 staging）**成功**（4 分 39 秒），跟 `project.json` 無關的失敗也沒有 |
| 私人值（主控補充） | VM 的 host、GCP 專案 id、zone、instance 四個值，對這個分支 21 個 commit（含訊息）與 `.scratch` 全部 30 個檔比：**0 筆**（比對時沒印值）。但 force push 前的舊 commit 還在 GitHub 上，見下面第 1 條 |
| 既有測試的改動（881473b → 8139692） | 改到的 9 個既有測試檔，斷言都在 spec「允許改的既有測試」裡（兩軸都逐條對過）。另外：`project-config.test.ts:3` 的 import（拿掉 `LEGACY` 必須跟著改）、limit-guard 兩支開頭的說明註解（見第 12 條）；`autosync.test.mjs` 只有新增（+54/−0）；`guard.test.ts` 見第 3 條 |

### 換手安全

| 查的 | 結果 |
|---|---|
| 家裡三份 `settings.json`（`~/.claude`、`-account1`、`-account2`） | `hooks` 三份逐字相同、都叫客廳的 `autosync.mjs --project`，跟客廳 `settings/settings.json` 相同 |
| 上一個專案的專案層 hook | 主資料夾與 10 個 worktree 都沒有 `.claude/settings*.json` 的 `hooks`；它 repo 裡追蹤的檔（`.local` 以外）沒有叫 `sync-claude`、`autosync.mjs`、`devbox.mjs` |
| 儀表板、mods、客廳程式 | 沒有任何路徑叫舊的 `sync-claude` 或上一個專案的 `devbox.mjs`（只剩註解與測試假資料） |
| VM 的說明 | `vm/README.md`「VM 壞了」第 3 步放回 `existing/` 的檔時**不含** `devbox-presync`；「第 3 階段換手」改成已做完、步驟留著 |
| Windows 排程 | 沒有叫同步的排程 |
| `.local` 整個同步 | 兩個 `.local` 的遠端都是 PRIVATE、都裝了 pre-push（推之前查 PRIVATE）；兩份 `.gitignore` 擋 `*.log` 與系統雜物；上一個專案 `references/` 會推（照她的規定）；這個專案 `.local` 只有記憶、開場、主控交接檔、`research/`、`vm-state.json`，沒有金鑰或登入備份 |
| 剩下的一條路 | **上一個專案的記憶與 `.local/README.md` 還把舊工具寫成現行做法**，見第 2 條 |

### 找到的

| # | 軸 | 哪裡 | 什麼情境會錯 | 建議 | 使用者決定？ |
|---|---|---|---|---|---|
| 1 | 私人值 | GitHub 上這個 repo（PUBLIC）：force push 前的那個 commit（SHA 不寫在這裡，免得多一個指路的；在主控的共用筆記資料夾 `segment7-review.md`） | 主控 amend 成 `eee6b6e`、force push 之後，舊的那個 **還拿得到**：GitHub 的 commit API 回得出來，repo 的 Activity 頁（公開 repo 誰都看得到）列著這次 force push 的前後 SHA，點進去就是舊的 diff。比對（不印值）：它含 **GCP 專案 id 與 VM 的 instance 名**（同一個字），沒有 host、zone。force push 只把它從分支上拿掉，GitHub 不會自己刪 | 要真的拿掉只能請 GitHub Support 清（GitHub 文件「Removing sensitive data from a repository」：force push 後聯絡 Support 移除快取的 view 與沒有分支指著的 commit）。送出是對外的、要使用者本人；Claude 可以先把要填的內容寫好（repo、SHA，不寫值本身）。另一個做法：接受（GCP 專案 id 本身不是金鑰，要有權限才進得去） | **要**：「要使用者決定的」段 7 第 1 題 |
| 2 ✅ 段 8（上一個專案 `.local` `2ca53a6`；兩份記憶在 frontmatter 後加一行、`MEMORY.md` 兩行說明、`.local/README.md` D 段／自動更新／手動更新各加一句；`tools/` 沒動、`references/` 沒讀） | 換手安全 | 上一個專案的記憶 `cloud-vm-devbox-2026-10-21.md`（「出門／回家：`.local/tools/devbox/devbox.mjs out\|home…`」）、`private-local-repo.md`（hook 跑 `.local/tools/autosync.mjs`）、它 `.local/README.md` 的 D 段、「自動更新」「手動更新」（`node tools/sync-claude.mjs`） | 在上一個專案的對話說「出門」「回家」或「手動同步一下」，Claude 照記憶跑**舊的** `devbox.mjs` 或 `sync-claude.mjs`：① `--restore` 把 `.local/claude-mods/`（10/29 11:10 之後不再更新）蓋到 `~/.claude/mods`，下一個對話開始時客廳的備份照基準點會把這份舊 mods 推進客廳（上游沒動過＝這台改的，照備份），兩台都接到、這一輪 guard／limit-guard／dash 的改動倒退；② 不帶 `--restore` 時把家裡 `handoffs/` 第一層（段 6 刪了，0 份）鏡像到 `.local/claude-handoffs/`，8 份被刪、推上去（下一次客廳的同步會補回）。現在沒有任何東西**自動**叫它們，只剩「照文件做」這條路 | 段 8：兩份記憶各加一行「2026-10-29 起換成客廳的工具（儀表板「雲端」分頁或 `<客廳>/tools/devbox.mjs`）；`.local/tools/` 的舊工具不要再叫，`--restore` 會把舊 mods 蓋回來」，`MEMORY.md` 那兩行的說明跟著改；`.local/README.md` 那三段加同一句（不是 `tools/`，spec 第 7 題只管 `tools/`）。舊工具本身照第 7 題下一輪才刪 | **要**（動的是上一個專案的記憶與它私人 repo 的 README，spec 沒列）：段 7 第 2 題 |
| 3 ✅ 段 8（客廳 `4324caf`；`diff 881473b` 剩 1 行、guard 38 全過） | Standards（硬） | 客廳 `mods/guard/tests/guard.test.ts`（`30a7191`） | 整個檔從 CRLF 換成 LF：一般的 `git diff 881473b 8139692` 顯示 138 行全改；`-w` 看只改了 spec 允許的 `:30` 那一行。實質沒改，但「既有測試一條都不改」用 diff 驗不出來，之後的審查每次都要多查一次 | 段 8 換回 CRLF（只改換行，客廳與 `~/.claude/mods` 一起），之後 `git diff 881473b -- guard.test.ts` 只剩一行 | 不用 |
| 4 ✅ 段 8（客廳 `3d13dec`） | Standards（硬） | 客廳 `docs/project-config.md` 的 `prodReadScripts` 那一列 vs `classify.ts:281` | 程式是「前後是字的邊界就算」（`dry-run.mjs` 也算 `run.mjs`），表上沒寫；同一張表的 `writeScripts`、`stagingScripts` 都寫「整個檔名相同才算」。別的專案照表寫，會以為 `dry-run.mjs` 不算。行為跟 `e8f9058` 那一版一樣（`/\b(history\|snapshot\|run)\.mjs\b/`），只是文件漏了 | 段 8 表上補一句（只改文件，不改比對方式：改成整個檔名相同會讓上一個專案的記錄變少） | 不用 |
| 5 | 段 7 自己 | 這個對話 | 查第 2 條時對上一個專案的記憶 `grep -n`，輸出帶出了 VM 名稱、GCP 專案、zone 等私人值（**只在這個對話**，沒寫進任何檔、repo）。違反「比對時不要把值印出來」的精神 | 之後查記憶或私人檔先 `grep -l`（只列檔名），要看內容再挑沒有私人值的那幾行 | 不用 |
| 6 ✅ 段 8（客廳 `9529bce`） | Spec（**少問**） | 客廳 guard `classify.ts:282`（`stagingScripts` 的推定） | 沒有 `project.json`（＝`STRICT`）又讀不到 `.firebaserc`（或 `register.ts` 讀不到專案資料夾）時：`node scripts/reset-staging.mjs --project <正式站 id>`、`npm run staging:reset -- --project <正式站 id>`，`e8f9058` 靠寫死的 id 認出正式站、**要問**；現在 id 認不出 → 「看不出環境」→ 又被 `stagingScripts` 推定成 staging → **不問**（段 7 拿兩版 classify 跑過）。違反 issue 01 判準 1（只准多問）。`parity-cases.ts` 沒有這條所以沒抓到。實際上上一個專案每條分支都有 `.firebaserc`，要碰到不容易 | 段 8：指令自己寫了 `--project`／`-P` 卻認不出時，不套 `stagingScripts`／`prodReadScripts` 的推定（看不出環境→寫入要問）。先把這兩條加進 `parity-cases.ts`（`legacy-parity` 讀不到 `.firebaserc` 那條會紅），再修到綠 | 不用（照「只會多問」） |
| 7 ✅ 段 8（客廳 `32923b0`） | Spec（**少問**，已知的段 1 中途發現 2，但範圍更大） | 客廳 guard `rulesFrom`（`classify.ts:88-91`） | `project.json` 壞掉不只「不是 JSON」：`[]`、`null` 也一樣。而且壞掉時 `neverWrite` 整個沒了：這個 repo 的 `gcloud firestore import … --project=<neverWrite 的專案>`，正常時擋（`neverWrite`），壞掉三種都**什麼都不記、不問**（段 7 跑過）。段 8 原訂的「壞掉＝最嚴預設」也救不回來：`STRICT` 沒有 `neverWrite`、也不認得 `gcloud firestore` 是寫入。等於 `CLAUDE.md`「絕對不寫入國王日記」的那道保護，在 `project.json` 打錯一個逗號時默默消失 | 壞掉（不是 JSON、不是物件）＝最嚴預設，**再加**：碰 Firebase／`gcloud`（模擬器除外）與 `git push` 的指令一律要問，框上寫「`.claude/project.json` 讀不懂，先修好」。紅燈測試：三種壞法 × 那條 `gcloud` 指令與推另一個 repo | **要**（擴大使用者 10/29 定的「壞掉＝最嚴預設」）：段 7 第 1 題 |
| 8 ✅ 段 9（客廳 `360a313`；跟 GitHub 不一樣的檔裡只有這台在基準點之後改的才算沒推上去，比對點 `merge-base(基準點, @{u})`、沒有基準點每個都算；devbox 不用改。既有 `mods.test.mjs:128` 1 → 0（主控照 A，spec 已寫）；新測試 devbox-mods 4、mods 1） | Spec（做錯） | 客廳 `autosync.mjs` 的 `checkModsNow`（`:382`）；`devbox.mjs` 的 `pushMods`（`:170`）、`vmMods`（`:210`）、`presyncMods`（`:384`）都靠它 | 「確認這台的 mods 推上去了」做成「這台＝GitHub 上的客廳」。VM 開著時家裡改了 mods 並推上客廳、VM 自己沒改：VM 照基準點不備份（對的），但 `--check-mods` 不一樣 → **回家（VM 開著）停在「VM 上的 mods 沒推上客廳」、VM 不關，重按一樣**（只能連進去手動 `--restore-mods`）；VM 關著時 presync 記 `mods: bad` → 回家不印 ✅、叫她 `--check-vm` → 又停在同一處。出門時家裡比客廳舊（VM 推過、家裡沒回家）也一樣停。測試沒有這個情境 | 段 8：改成「這台在基準點之後改過的檔都已經在 GitHub 上的客廳」——這台跟基準點一樣（沒改）或跟 `@{u}` 一樣都算過。紅燈先：VM 開著、家裡推了 mods、VM 沒改 → 回家照常關 VM、家裡接客廳那一份；VM 有改又沒推上去 → 照舊停 | 不用（照 issue 04 的意思：要確認的是「這台改的」推上去了） |
| 9 ✅ 段 8（客廳 `3d13dec`，只改文件） | Spec | 客廳 `autosync.mjs:328`（沒有基準點的 Windows 照舊備份）＋`README.md`「新電腦怎麼接」 | 新電腦第 6 步就裝全域 hook，第 8 步才 `--restore-mods`：中間開的任何對話（例如幫忙設定的那一個），如果這台已經有一份舊的或不完整的 `~/.claude/mods`，備份會把客廳有、這台沒有的檔刪掉推上去（`~/.claude/mods` 不存在就不會）。家裡現在已經有基準點，不受影響 | 段 8 只改文件：「新電腦怎麼接」把 `--restore-mods` 排到裝 hook 之前（拿掉 Windows 的例外要改既有測試「客廳：備份 mods…」，不在允許清單，不做） | 不用 |
| 10 ✅ 段 8（客廳 `f264938`） | Spec（spec 沒要的，多問） | 客廳 guard：`firebase use <認不出的專案>` 每個專案都要問（issue 01「跟 issue 寫的不同」第 1 點） | 不在 spec「行為會變的（使用者點過頭的）」。而且 **`firebase use default`（`.firebaserc` 的別名）現在也要問**，`e8f9058` 不問（段 7 跑過；`firebase use staging` 照舊不問） | 段 8：`default` 照 `.firebaserc` 的別名認（跟 `staging`、`prod` 一樣）；`firebase use <真的認不出的>` 照 issue 01 留著要問，寫進 spec「行為會變的」 | **要**（使用者沒點過頭）：併進段 7 第 1 題 |
| 11 ✅ 段 9（客廳 `1da2f16`，只改文件：`vm/README.md`「新專案上 VM」第 3 步加「一定要在 VM 上跑完第 2 步（含 `add-project.sh`）之後才加」；程式沒動，碰到時照舊停） | Spec | 客廳 `devbox.mjs:337`（VM 關著、沒有 `vm-state.json` 就停） | `devbox.json` 的 `projects` 有、VM 上卻還沒有的專案（例如新專案先加進設定、還沒在 VM 上跑 `add-project.sh`）：presync 跳過它、不寫 `vm-state.json` → 之後**每次** VM 關著回家都停在它。現在兩個專案 VM 上都有，碰不到 | 下一輪；或段 8 在 `vm/README.md` 加一句「加進 `devbox.json` 之前先在 VM 上跑 `add-project.sh`」 | 不用 |
| 12 ✅ 段 8（客廳 `3d13dec`；limit-guard 52 全過、tsc 0 錯、validate 過、兩份 mods 相同） | Spec（小） | limit-guard `tests/handoff-dir.test.ts:8` 的開頭說明 | 寫「只讀自己的子資料夾」，但程式照舊讀第一層（05 做法的「跟 issue 寫的不同」第 1 點）。另外 spec「允許改的既有測試」寫的行號已經移動（`guard.test.ts:30` 實際在 `:32`、`project-config.test.ts:51` 在 `:63`），改的內容對得上 | 段 8 改那一行說明（不動斷言）；spec 的行號不改（內容寫得清楚） | 不用 |

### 判斷題（Standards 軸的異味；不擋合併）

| # | 異味 | 哪裡 | 建議 |
|---|---|---|---|
| J1 | Duplicated Code、Shotgun Surgery | 客廳 `devbox.mjs`：叫 autosync 有三種寫法（`:145`、`:154`、`:423`）、「mods 備份＋比對」三份（`:170`、`:210`、`:384`）、「`.local` 推完了沒」兩份（`:155`、`:424`）——因為 autosync 推不上去也 exit 0（`commitAndPush` 只寫 log），呼叫端只好自己再查 git | 段 8 修段 5 中途發現 1 時會碰到 `commitAndPush`：**不要**順手加第三套檢查；之後（下一輪）考慮讓 autosync 有「推不上就 exit 1」的模式，devbox 只看 exit code |
| J2 | Mysterious Name | 客廳 `--no-home`（`devbox.mjs:154,193,423`） | 意思是「不做 mods」，又撞到 devbox 的 `home`（回家）。下一輪改名 `--no-mods` |
| J3 | Repeated Switches | `autosync.mjs:50,233,312,391,407` | 模式旗標散在 5 處；下一輪在開頭算一次 mode |
| J4 | Duplicated Code | limit-guard `hooks/accounts.ts` 與 dash 各一套 `desktopEmail`、`emailOf`、以 email 去重 | 兩個 mod 不能互相 import；下一輪加一條測試釘住兩邊認法一致 |
| J5 | Duplicated Code | 客廳 `autosync.mjs` 的 `mainDir`（`:201`）與 limit-guard `worktreeOf`（`:133`）；開場資料夾名兩邊各算一次 | 改開場命名時兩處一起改；下一輪 |
| J6 | Primitive Obsession | `devbox.mjs:339,391,401` 的 `'ok'`／`'none'`／`'bad'` 字串寫進 `vm-state.json` | 下一輪 |
| J7 | Mysterious Name | dash `:1849,1880`（`devboxScript` 回 `{script, project}` 放進叫 `script` 的變數；`Devbox.project` 是路徑、`DashVm.project` 是資料夾名）；`:1976` 寫死退路路徑跟 `devboxPath`（`:1858`）重複 | 下一輪 |
| J8 | Duplicated Code | 客廳 `tools/mods.test.mjs`、`tools/devbox-mods.test.mjs` 又各抄一份測試小工具 | 下一輪抽 `tools/test-helpers.mjs` |
| J9 | 小的 | guard `classify.ts:91`（`STRICT as unknown as Record` 送進清洗設定的函式）、`:246`（拼假指令字串重用 `envOf`） | 不修 |

上一輪段 6 審查的硬違規（路由寫三處、Status 三套、hook 腳本正本在這個 repo、寫死專案名字）與 `rules.legacy` 的 Repeated Switches 都修好了（Standards 軸確認）。

## 中途發現

### 段 9

| # | 哪裡 | 什麼情境會錯 | 建議 |
|---|---|---|---|
| 1 | 客廳 `devbox.mjs` 回家的家裡那一半 `pullLocal`（`.local` 照舊 `pull --ff-only`） | 段 9 只照決定改了「出門」的 VM 那一半。家裡的 `.local` 有沒推上去的 commit、VM 也推了新的時，回家停在「家裡電腦的 X/.local 拉不下來」。段 9 之後家裡的自動同步推之前會 `pull --rebase`，家裡留著沒推的 commit 只剩「兩台改了同一個檔」那一種（那種本來就要人看），所以很少碰到 | 下一輪：`pullLocal` 也 `pull --rebase --autostash`、衝突就 abort 停（跟 `out` 同一種寫法）；或維持現狀。不急 |

### 段 8

| # | 哪裡 | 什麼情境會錯 | 建議 |
|---|---|---|---|
| 1 | 這個環境的 Bash 工具（heredoc 餵 python） | `<<'EOF'` 裡寫 `\\b`，python 收到的是 `\b`（退格字元）：第 7 條第一次寫進 `classify.ts` 的兩個 regex 變成控制字元，5 支測試檔載不進來（馬上看到、用 Write 寫的修正腳本改回，`grep -c $'\x08'` 0 筆）。測試檔裡的 `\\.` 也是同一回事（只是剛好沒壞） | 要寫反斜線的檔用 Write／Edit；可以考慮記進 `docs/agents/lessons.md` |
| 2 | guard 的 Firestore REST 那一段（`curl …firestore.googleapis.com…` 掃整行） | 段 8 寫測試時，heredoc 裡的測試字串含 `curl https://firestore.googleapis.com/…`，guard 記成「看不出是哪一個環境讀（Firestore REST）」。其實什麼都沒讀。跟段 1 中途發現 1 同一類（指令文字裡的字被當成指令） | 下一輪修段 1 中途發現 1 時一起：REST 那一段也只看一段指令的開頭 |
| 3 | 第 7 條的範圍 | 使用者答的是「碰 Firebase／`gcloud`（模擬器除外）與 `git push`」。段 8 另外把 `gh` 的寫入（`gh pr create`、`gh api -X …` 等，`GH_WRITE`）也算進「讀不懂要問」：`neverWrite` 的 git repo 本來就也擋 `gh` 寫入，讀不懂時這一半保護也會消失。只會多問，寫進 spec「行為會變的」 | 不用決定；記著。要拿掉只要刪 `classify.ts` 裡 `rules.broken` 那一段的 `GH_WRITE` 一行 |
| 4 | 第 7 條，`project.json` 合法但欄位壞掉 | 例如 `"neverWrite": {}`（不是陣列）照舊當成「沒有 neverWrite」、不標成讀不懂，國王日記那道保護一樣消失。段 7 第 1 題只講整個檔讀不懂 | 下一輪：`neverWrite` 在但不是陣列（或某一項沒有 `firebaseProject`／`gitRepo`）也當成讀不懂。只會多問 |
| 5 | guard 的 `neverWrite`（`git push`、`gh` 寫入、`gcloud firestore` 都掃整串指令文字，heredoc 內文也算） | 段 8 13:43 用 python heredoc 改兩個測試檔時，heredoc 裡的**測試字串**（推國王日記的 repo、`gh` 開 PR 到它、`gcloud` 匯入到國王日記的專案）被當成真的指令，跳出「Claude 要寫絕對不能寫的地方」的框。使用者嚇了一跳去問主控；主控核對過整條指令（只改兩個本地測試檔再跑測試）、跟使用者說明、建議允許。跟段 1 中途發現 1 同一類，但範圍更大：不只 firebase CLI | 下一輪跟段 1 中途發現 1 一起修：每一種指令都只看「一段指令的開頭」，跳過 heredoc 內文與引號裡的字。修好之前，要寫這類測試字串時**先在對話裡跟使用者說「等一下會跳框，是測試字串」**；改測試檔用 Write／Edit（不經過 guard 的 Bash 檢查）也可以避開 |
| 6 | 這個環境的 Bash 工具（段 8 續） | ① 指令裡 `"$(… grep -c $'\r' …)"` 這種「`$(…)` 裡有 `$'…'`」會報 `unexpected EOF while looking for matching )`，**但報錯之前的部分已經跑了**：段 8 續第一次改上一個專案的記憶時，報錯了、第一份記憶其實已經改了（馬上查到、沒有重複插入）。② Git Bash 的 `awk` 輸出把 CRLF 變成 LF（那份記憶整份變 LF，用 python 換回 CRLF、逐檔核對 LF＝CRLF 數）。③ 上一個專案 `.local/claude-memory/cloud-vm-devbox-2026-10-21.md` 本來就是 LF、`~/.claude` 那份是 CRLF：這次同步把 `.local` 那份整份換成 CRLF，`2ca53a6` 看起來改 60 行，`--strip-trailing-cr` 比只多 2 行 | 會報錯的指令不要當成「沒跑」，先查狀態再重來；改有 CRLF 的檔用 python（讀寫 bytes）或 Edit。可以跟段 8 第 1 條一起記進 `docs/agents/lessons.md` |

### 段 6

| # | 哪裡 | 什麼情境會錯 | 建議 |
|---|---|---|---|
| 1 | dash `register.tsx:1837`、`:1993`、`types/index.d.ts:82` | 「雲端」分頁的標題寫死 VM 的 instance 名（私人值：跟 GCP 專案 id 同一個字，不寫進這個 repo；不是上一個專案的名字）。VM 換名字或重建成別的名字時，畫面上的字不會跟著變 | 讀客廳 `vm/devbox.json` 的 `instance`（或 devbox.mjs `status` 印出來的）。不急，畫面的字會變要截圖；下一輪 |
| 2 | 上一個專案的 `project.json` 只在 `develop` | `main`、它現在的分支 `claude/availability-sheet-chart-no`、10 個 worktree 都還沒有這個檔，照最嚴預設＝跟有這個檔時逐條相同，所以不會少問。`develop` 進 `main` 時跟著進去 | 不用修；記著 |

### 段 5

| # | 哪裡 | 什麼情境會錯 | 建議 |
|---|---|---|---|
| 1 ✅ 段 9（客廳 `7345fbf`；`.local` 推之前 `pull --rebase`、推被拒再拉一次重推，衝突就 abort、commit 留著；`out` 的 VM 那一半 `.local` `pull --rebase --autostash`，接不起來就 abort、停。客廳不 rebase。新測試 autosync 3、devbox-mods 3，既有一字不改） | 客廳 `autosync.mjs` 的 `commitAndPush`（推之前不 `pull`），VM 關機時的 presync | VM 開著的時候，家裡（主控 session）在 12:20 推了這個專案 `.local` 一個 commit；12:22 VM 關機，presync 在 VM 那份舊的 `.local` 上寫 `vm-state.json`、commit、push → **被拒（不是 fast-forward）**，GitHub 上這個專案的 `vm-state.json` 還是 10/28 那份（上一個專案的推上去了）。VM 上那份 `.local` 現在多一個沒推的 commit（或沒 commit 的 `vm-state.json`；要開 VM 看 `journalctl -u claude-home-presync -b -1` 才確定）。後果：① 下次「出門」，VM 那一半的 `git -C .local pull --ff-only` 會停在這個專案（「VM 上 baobuverse-kingdom 沒接好」，VM 開著）；② VM 關著時按「回家」，這個專案的 `vm-state.json` 比 VM 最後一次開機舊 → 停、叫 `--check-vm`。這次沒出事是因為用 VM 開著的「回家」關機。主控在家裡、VM 開著，兩台同時寫 `.local` 是常態（主控交接檔、開場） | `commitAndPush` 推之前 `pull --rebase`（`.local` 只有自動產生的檔），推失敗再 `pull --rebase` 重推一次；`out` 的 VM 那一半 `.local` 用 `pull --rebase`。要紅燈測試（兩台各一個 commit）。見「要使用者決定的」段 5 |
| 2 | VM 開機就有 session 程序 | `devbox-rc` 開機後 Remote Control 馬上帶起 `--sdk-url` 的程序（12:03 就有兩個，在上一個專案的資料夾）；`vm/README.md` 說「VM 上任何對話開始之前」換 hook，但 `out` 開機後也馬上在 VM 上做事。這次舊的同步沒跑（log 沒有新行），換好之後也不會再有這個問題 | 不用修（換手只有這一次）。新 VM 重建時照 `vm/README.md`「VM 壞了」第 4 步先換 hook 再 enable Remote Control |
| 3 | VM 上 `~/.claude/mods` | 判準 5 加的那一行註解（`e2e-progress/tests/parse.test.ts`）還在 VM 上（家裡改回來時 VM 關著）。VM 的基準點 `807bc91`、上游 `7e375d5` 之後改過 → VM 對話結束不會推回去；下次「出門」`--restore-mods` 接回客廳那一份 | 不用修；下次出門後 `--check-mods` 看一次 |
| 4 | VM 的平放開場 | VM 第一層的 8 份還在（只複製、沒刪）。VM 上已經沒有東西會叫舊的 sync-claude（hook 換了、`devbox-presync` 停了），limit-guard 也跳過跟子資料夾同名的 | 06 刪家裡的；VM 的等下次開 VM 再刪（要開 VM，06 不開） |

### 段 4

| # | 哪裡 | 什麼情境會錯 | 建議 |
|---|---|---|---|
| 1 | 儀表板帶的 `--project`（在 worktree 開的對話） | 帶的是 worktree 的路徑，客廳 `devbox.mjs` 的 `checkProjectArg` 拿它跟 `devbox.json` 的 `home` 比，對不到 → 多印一行「⚠️ <worktree 名> 還沒加進 VM 的清單」。處理的照樣是清單上每一個專案 | 儀表板或 `checkProjectArg` 改成看主資料夾（跟 autosync 的 `mainDir` 同一種認法）。不急；段 8 或下一輪 |
| 2 | 從現在到段 5 換完 VM 那一半 | 家裡在上一個專案存的新開場只在 `handoffs/baobao-wellness-clinic-scheduler/`。段 5 在 VM 上如果先開了對話（VM 的全域 hook 還是舊的），舊的 sync-claude 用 VM 的第一層鏡像 `.local/claude-handoffs/`，會把家裡新存的那份從 `.local` 刪掉並推上去（家裡子資料夾那份還在，下次家裡同步再加回去） | 段 5 照 `vm/README.md` 的順序：VM 上**任何對話開始之前**先換全域 hook、複製平放的開場（已寫進段 5 開場） |
| 3 | limit-guard 讀開場 | 子資料夾裡的開場不再比 `root`（worktree 存的要讓主資料夾接得到）。同一台電腦上兩個不同的專案資料夾名字相同時會互相接到；之前比資料夾名字也一樣分不出來 | 不用修；記著 |
| 4 | `~/.claude-account1/settings.json` | 沒有 `hooks`（換手前後都沒有）：VS Code 切到 account1 開的對話，記憶、開場、mods 都不自動同步，要等下一個在別的資料夾開的對話才補上 | 加同一段 `hooks`（跟 `~/.claude`、`~/.claude-account2` 一樣）。改 settings，要主控／使用者點頭 |
| 5 | issue 05 的「動工前先讀」 | 只列了 `~/.claude/settings.json`，漏了 VS Code 讀的 `~/.claude-account2/settings.json`，判準 1 第一次在 VS Code 測才露出來（舊的同步又跑了一次，推了 `claude-mods/`） | 已改（段 4）。08 在 VM 上也要看：VM 有沒有用 `CLAUDE_CONFIG_DIR` 的帳號資料夾（例如 `acct1`），每一份 `settings.json` 的 `hooks` 都要換 |

### 段 3

| # | 哪裡 | 什麼情境會錯 | 建議 |
|---|---|---|---|
| 1 | 在暫存資料夾 clone 上一個專案的 `.local`（判準 5 的試跑） | 第一次 clone 在 scratchpad 的深路徑，Windows 路徑太長、checkout 失敗，git 的錯誤訊息**印出了 5 個 `references/` 底下的檔名**（月底對帳測試截圖的檔名，沒有內容；只出現在這個對話，沒進任何檔案或 repo）。違反「`references/` 不讀」 | 改用短路徑＋`git -c core.longpaths=true`、錯誤導到檔案只算行數，第二次 0 行。之後的段照這個做（已寫進段 4 開場） |
| 2 | 段 3 做完到 05 做完之間的儀表板 | 這個專案的「雲端」分頁叫客廳的 devbox，現在**也會處理上一個專案**；上一個專案資料夾裡的「雲端」分頁還是叫它自己的舊 devbox（還原 `claude-mods/` 的舊 mods）。VM 那一半還沒換（`devbox-presync` 還在、VM 的全域 hook 還是舊的），按了哪一邊都可能兩套同步一起跑 | 照舊：段 5 做完之前**不要按出門／回家**（哪個資料夾都一樣）。05 讓儀表板一律叫客廳的（**段 4 做了**：家裡哪個資料夾都叫客廳的；VM 那一半在段 5） |
| 3 | VM 關機時給 `presync` 多久 | Google 文件只寫「短時間」，沒給秒數。改成並行、每一步限時（約 75 秒內），`TimeoutStopSec=80` 沒動，但沒在真的 VM 上量過 | 08 回家關機之後，下次開 VM 看 `journalctl -u claude-home-presync -b -1` 實際跑了幾秒、每個專案都寫了「…」那一行 |
| 4 | 05 做法 7（複本上比新舊同步） | 複本的路徑跟真的不同，客廳的 `memoryDir` 找不到記憶（看起來「0 個變動」其實是沒找到）；舊工具寫死了 `c--…` 的代號所以找得到。另外 clone 時全域 `core.autocrlf=true`，記憶看起來 54 個檔「改了」，其實只有換行（`--ignore-cr-at-eol` 0 個） | 用暫存的 `CLAUDE_CONFIG_DIR` 放 `projects/<複本路徑代號>/memory`；複本 `core.autocrlf false` 再 `reset --hard`。段 3 照這樣試過：記憶 0 個變動、`references/` 多一個檔 → 1 個會 commit |
| 5 | 08 的順序 | VM 上的客廳 `pull` 之後，`claude-home-presync` 就會處理上一個專案（寫它的 `vm-state.json`、整個 `.local` commit）；如果 `devbox-presync` 還沒停用，關機時兩個同步一起動上一個專案的 `.local` | `vm/README.md`「第 3 階段換手」第 1 步（停用 `devbox-presync`）一定要在 VM 關機之前做；08 照那個順序 |

### 段 2

| # | 哪裡 | 什麼情境會錯 | 建議 |
|---|---|---|---|
| 1 ✅ 段 9（客廳 `0a3c7cd`；新 `sameAccount`：兩邊都有 email 就比 email、讀不到照舊比資料夾；新測試 `tests/next-account.test.tsx` 4 條，dash 38 全過、tsc 0 錯、validate 過；**截圖 10/29 過了**（不同 email 那一種：照常顯示「VS Code 新對話會用「另一個帳號」」、排版正常；同一個 email 不顯示那一種沒截到，靠 `next-account.test.tsx` 的兩條紅燈測試）） | dash 總覽底下那行「新對話會用「X」」（`register.tsx` 的 `next.key !== cur.key`） | 比的是資料夾不是 email：這個對話用預設資料夾、VS Code 新對話用 account2（同一個帳號）時，會寫「新對話會用「帳號 A」」，但這個對話本來就是帳號 A。03 說只改兩處，沒動 | 改成比 email（同一個 email 就不寫）。一行，畫面上的字會變，要截圖；放段 8 或下一輪 |
| 2 | 測試的寫法（給之後改 mods 的段） | 測試的 `$` 不能直接拿來呼叫模組裡的函式（`$.env` 是 undefined）；引擎也規定 `$.env.get` 要寫字面上的名字（傳變數整個模組載不進來）。02 因此把讀帳號抽成 `hooks/accounts.ts`，吃一個小的 `Io` | 不用修；要直接測模組裡的函式就照 02 的做法抽出來。可以考慮記進 `docs/agents/lessons.md` 或客廳 plugin-authoring skill |
| 3 | `~/.claude/mods-data/accounts.json` 的 account1 `label` | 還寫著「終端機」。只有那個資料夾讀不到 email（沒登入）時畫面上才會看到 `label` | 使用者想改再改（私人資料，不在任何 repo）；不急 |

### 段 1

| # | 哪裡 | 什麼情境會錯 | 建議 |
|---|---|---|---|
| 1 | guard `classify.ts` 的 firebase CLI 那一段（`/\bfirebase\s+([\w:-]+)…/g` 掃整行指令） | 指令**字串裡**寫到 `firebase deploy` 也算：`git commit -m` 的訊息、`python - <<EOF` 裡的字串、PR 內文。段 1 有 4 次被記成「看不出是哪一個環境寫（firebase deploy）」（有寫入的那種照規則還會跳框問）。`node -e`／heredoc 那一段已經有「只算真的交給 node 跑的」判斷，firebase CLI 這段沒有 | firebase CLI 只看「一段指令的開頭」（`;`、`&&`、`\|`、換行之後的第一個字），跳過 heredoc 的內文與引號裡的字。屬於「多問」不是「少問」，不急；下一輪或段 8 一起修 |
| 2 | guard `rulesFrom` | `project.json` 壞掉（不是合法 JSON）照舊當成「有設定、沒有特例」：比最嚴預設**少問**推 main、`npm run restore`（但不會把認不出的推定成 staging）。這是 09 定的，01 沒動 | 要「只會多問」就改成壞掉＝最嚴預設；要的話是一行，但會改 `project-config.test.ts:112` 的意思 |


## 要使用者做的

- ~~**送 GitHub Support 清 force push 之前那個舊 commit**（段 7 第 1 條、第 3 題「要清」）~~ → **使用者 2026-10-29 改成「不送（建議）」**（主控 session）：外流的只有 GCP 專案 id（＝VM 的 instance 名），不是金鑰、沒權限進不去，Support 也可能回不處理。
  `.local/github-support-request.md` 留著，之後改主意可以照它送。
- ~~**段 3 做完到段 5 做完之間，不要按出門／回家**~~ → 段 5（10/29）VM 那一半換完了，這個區間結束。
  ~~但下次按「出門」之前先看段 5 中途發現 1~~ → 段 9 修好了（客廳 `7345fbf`）：「出門」的 VM 那一半會把 VM 上那個沒推的 commit 接在家裡推的後面，VM 上之後的自動同步會推上去。
  VM 關著時按「回家」照舊會停、叫 `--check-vm`（10/29 那次關機的 `vm-state.json` 沒推上去，比最後一次開機舊；開著回家或 `--check-vm` 一次就好。現在家裡已經是最新的，不用按）。
- **下次開 VM 時順便**（不用特地開；開了再做，段 5 留下的）：
  1. `journalctl -u claude-home-presync -b -1`：10/29 那次關機 presync 實際跑了幾秒、兩個專案各寫了什麼（段 3 中途發現 3；這個專案應該是「沒推成」，段 5 中途發現 1）
  2. 這個專案 VM 上的 `.local`：`git -C ~/baobuverse-kingdom/.local status`、`log @{u}..HEAD`；有那個沒推的 `vm-state.json` commit 的話，段 9 之後 VM 上第一個對話開始（或「出門」）就會 `pull --rebase` 推上去，看一眼推上去了沒就好
  3. VM 上 `~/.claude/mods-data/handoffs/` 第一層 8 份刪掉（子資料夾有一樣的，刪前逐檔 `cmp`；家裡的段 6 刪了）
- ~~VM 上這個專案的 workspace trust ×2、手機確認~~：10/29 段 5 使用者本人做了。
- ~~**03 的截圖**（段 2）~~：10/29 截好、過了（issue 03 底下「截圖結果」）。
- ~~**05 的截圖**~~ → **10/29 過了**（主控看過：上一個專案資料夾的儀表板「雲端」分頁，狀態「關著」照常，按鈕下多出「在 baobao-wellness-clinic-scheduler 按的：VM 上的每一個專案都會一起處理（客廳的 devbox.mjs）」）。原本的步驟：
  （段 4，儀表板「雲端」分頁的字變了）：在**上一個專案的資料夾**開新對話（桌面 app 或 VS Code），打開儀表板 → 點「雲端」分頁，**不要按出門／回家**。
  要看到：狀態（開著／關著）照常、按鈕底下多一行「在 baobao-wellness-clinic-scheduler 按的：VM 上的每一個專案都會一起處理（客廳的 devbox.mjs）」。
  對照：在這個專案的資料夾看同一頁，那一行寫「在 baobuverse-kingdom 按的：…」（之前就有）。
- ~~**`~/.claude-account1/settings.json` 加 `hooks`**（段 4 中途發現 4，使用者 2026-10-29 選「補上」；段 4 改的時候被 auto mode 擋了 Self-Modification）~~
  → **主控 2026-10-29 代改（使用者同意）**：使用者在主控 session 說「我同意你幫我」，主控用 Edit 改的，沒被擋；改前備份在主控 scratchpad。
  主控查過 JSON 合法、其他三個 key 沒動；段 4 也對過一次：`hooks` 跟 `~/.claude-account2` 的一樣。11:20 那個 account1 的對話在補上之前，沒同步是預期的。

## 要使用者決定的

### 段 9

1. ~~**段 7 第 8 條（`--check-mods` 改成「這台改的推上去了」）一定會改到 `mods.test.mjs:128`，spec 沒列：要改嗎？**~~ → **主控 2026-10-29「照 A」**（主控的決定，不是使用者）：
   那條最後的 `--check-mods` 1 → 0、同一條其他斷言不動，寫進 spec「允許改的既有測試」（已寫）；不開 B 的新旗標；比對點用 `merge-base(基準點, @{u})`、`:165` 照舊 exit 1；
   另外補一條「家裡比客廳舊、而且自己改過 mods（沒推）→ 照舊 exit 1」（已補：`mods.test.mjs` 新的一條；把比對改成全放過時它會紅，確認過）。之後再碰到要改既有測試的，一樣先停、問主控。
   B（`--check-mods` 一字不改、給 devbox 另開一個旗標）沒選。

### 段 7

一次問一題，照這個順序（第 1、2 題的答案段 8 要用；第 3 題不擋）。

1. ~~**guard 的兩處「多問」照建議做嗎？**（段 7 第 7、10 條）~~ → **使用者 2026-10-29「照建議」**（主控 session）：(a)、(b) 都照建議做。原本的題目：
   - (a) `project.json` 壞掉（不是 JSON、`[]`、`null`）：最嚴預設，**再加**碰 Firebase／`gcloud`（模擬器除外）與 `git push` 的指令一律要問，框上寫「`.claude/project.json` 讀不懂，先修好」。
     理由：10/29 選的「壞掉＝最嚴預設」不夠——最嚴預設沒有 `neverWrite`，`project.json` 打錯一個逗號，國王日記那個 database 的保護就整個消失（段 7 跑過）。
   - (b) `firebase use <認不出的專案>` 照段 1 做的要問（寫進 spec「行為會變的」）；`firebase use default` 改回不問（它是 `.firebaserc` 的別名，原本就不問）。
   建議：**照建議**（兩項都只會多問）。另一個做法：(a) 只做原本的「壞掉＝最嚴預設」——國王日記保護消失的洞留著；(b) 回到 `firebase use` 都不問——上一個專案讀不到 `.firebaserc` 時 `firebase use <正式站 id>` 會少問（段 1 加這條的理由）。
2. ~~**段 8 要不要改上一個專案記憶裡、`.local/README.md` 裡舊工具的說明？**（段 7 第 2 條）~~ → **使用者 2026-10-29「改（建議）」**（主控 session）。原本的題目：
   要動的：記憶 `cloud-vm-devbox-2026-10-21.md`、`private-local-repo.md` 各加一行「2026-10-29 起換成客廳的工具，舊的不要叫」，`MEMORY.md` 那兩行的說明跟著改；它私人 repo 的 `.local/README.md` 三段各加一句。
   這些都會被自動同步推進它的私人 repo（有版控，改錯救得回來）；`.local/tools/` 不動（第 7 題）。
   建議：**改**。不改的話，在上一個專案說「出門」「回家」「同步一下」，Claude 照記憶跑舊工具，會把 10/29 之前的舊 mods 蓋回來、再被推進客廳。
   另一個做法：不改，下一輪刪舊工具時一起改；這段時間在上一個專案出門／回家只用儀表板，不叫 Claude 做。
3. ~~**force push 之前那個 commit（含 GCP 專案 id、VM 的 instance 名）要不要請 GitHub Support 清掉？**（段 7 第 1 條）~~ → **使用者 2026-10-29「要清（建議）」**（主控 session），**同一天改成「不送（建議）」**（見「使用者已經決定的」）。
   主控把要填的內容寫在這個專案的 `.local/github-support-request.md`（私人，不進公開 repo），由使用者本人送（見「要使用者做的」）。原本的題目：
   現在：分支上已經沒有，但 GitHub 上用 SHA 還拿得到，repo 的 Activity 頁（公開 repo 誰都看得到）列著那次 force push。要清只能**本人**送 GitHub Support 的表單（對外送出，Claude 不能代送）；
   Claude 可以先把要填的字寫好（repo、那個 commit 的 SHA、「force push 移除了敏感資料，請清掉快取的 view 與沒有分支指著的 commit」，不寫值本身）。
   建議：**請 Support 清**（10/29 選了改寫歷史，就是要它不在公開的地方；force push 只做到一半）。另一個做法：接受（GCP 專案 id 不是金鑰，沒有權限進不去）。

### 段 5

1. ~~**段 5 中途發現 1（兩台同時寫 `.local`，VM 關機時推不上去）什麼時候修？**~~ → **使用者 2026-10-29「段 8 修（建議）」**（主控 session）。原本的題目：建議：**段 8 修**（客廳 `autosync.mjs` 的 `commitAndPush` 推之前 `pull --rebase`、推失敗再試一次；`devbox.mjs out` 的 `.local` 改 `pull --rebase`；先寫紅燈測試）。
   理由：不修的話下次「出門」很可能停在這個專案（VM 上那個沒推的 commit），而主控在家裡、VM 開著時兩台同時寫 `.local` 是常態，之後每次都可能再發生。這一輪的範圍是「上一個專案改用客廳的工具」，presync 換成客廳的才暴露出來，算這一輪的。
   另一個做法：放下一輪，這一輪結束前不按「出門」；要按就先照「要使用者做的」第 2 項手動處理。

### 段 3

1. ~~**`devbox.test.mjs` 測 legacy 的 9 條既有測試，spec 沒列**~~ → **主控 2026-10-29「照 A」**（主控的決定：issue 04 做法 3 本來就要拿掉 legacy 分支，測試跟著改是行為變了必須改的，不算少問）。
   刪 4 條、5 條只拿掉 `legacyCalls()` 那一行，spec「允許改的既有測試」逐條寫了。主控另外三個條件都做了：刪的 4 條各有一條上一個專案當主角的新測試；spec 與 issue 04 都寫；「VM 出門接過 mods 之後才開始備份」有一條測試。
   B（留著沒人用的 legacy 分支、既有測試一字不改）沒選。

### 段 1

1. ~~**spec「允許改的既有測試」漏了兩行**~~ → **主控 2026-10-29「照建議」**：兩行都補進 spec；`:51` 改成跟「最嚴預設＋那份 `.firebaserc` 的 id」比（客廳 `2e1f9b5`）。同一類（拿掉寫死 id → 多問）之後不用再問，會少問的才停下來問。原本的題目：
   `guard.test.ts` 的 `touched('firebase deploy --only hosting')`（`staging:write` → `unknown:write`）、`project-config.test.ts` 的「讀設定那條路跟 `classify()` 一樣」（改成跟 `e8f9058` 比）。
   兩行都靠 `classify()` 預設參數裡寫死的上一個專案 id；01 要拿掉寫死的 id，預設參數變成最嚴預設之後，這兩行就是判準允許的第 2 類（讀不到 `.firebaserc` → 看不出環境 → 要問）。
   另一個做法是預設參數留著寫死的 id（違反 01 判準 4）。
2. ~~（不擋）中途發現 1、2 要不要這一輪修~~ → **使用者 2026-10-29「照建議」**（主控 session 轉達，見下面「使用者已經決定的」）。原本的題目：建議 1 放下一輪（只是多問）、2 不改（09 的決定）。

## 使用者已經決定的（2026-10-29）

- spec「使用者選的答案」7 題：「都照建議」。
- 範圍：儀表板那輪中途發現 ①～③ 併進來（「好，併進去」）；E2E 放下一輪（「好，開始」）。
- 段 1 中途發現 1、2（「照建議」，主控 session 轉達、主控的解讀）：
  - 1（guard 把指令**文字裡**的 `firebase deploy` 當成指令，多問）：放下一輪。
  - 2（`project.json` 壞掉時比最嚴預設少問）：改成「壞掉＝最嚴預設」，**段 8 修**；會改 `project-config.test.ts:112` 的意思，修時把它加進 spec「允許改的既有測試」。
- 段 2 中途發現 1、3（使用者：「第 2 段另外記了兩個小問題都照你的建議」，主控 session）：
  - 1（dash 總覽「新對話會用 X」比資料夾不比 email）：**段 8 修**，畫面的字會變，要截圖。
  - 3（`accounts.json` 的 account1 `label` 還寫「終端機」）：主控改成跟另外兩個同一個寫法（「account1 資料夾」）；私人資料，不在任何 repo，改前備份在主控 scratchpad。
- 主控換帳號（2026-10-29，使用者：「你先休息換另一個帳號做，等到12:00之後或他也到limit之後我再請她換回來給妳接手主控台」）：另一個帳號的新對話讀 `.local/main-session-handoff.md` 接手主控，照這份開段 3。之後可能再換回來，兩邊都照這份與主控交接檔接續。
- 段 4 中途發現 4（`~/.claude-account1/settings.json` 沒有 `hooks`）：主控建議 A（加同一段），使用者 2026-10-29 選「補上」（主控 session 轉達）。段 4 改的時候被 auto mode 擋了，使用者同意後主控 2026-10-29 代改。
- 段 4 dash `vm-projects.test.tsx:98-106`（客廳還沒 clone → 照舊叫上一個專案那一支）：主控 2026-10-29「照 A」（主控的決定，不是使用者）：拿掉退路、寫清楚要 clone 到哪；spec「允許改的既有測試」已補。
- 段 5 中途發現 1（兩台同時寫 `.local`，VM 關機時這個專案的 `vm-state.json` 推不上去）：使用者 2026-10-29 選「段 8 修（建議）」（主控 session）。段 8 改客廳 `autosync.mjs` 的 `commitAndPush`（推之前 `pull --rebase`、失敗再試一次）與 `devbox.mjs out` 的 `.local`（`pull --rebase`），紅燈測試先。修好之前不按「出門」。
  （段 7 把收尾拆成段 8、9 之後，這一項在**段 9**。拆段是段 7 的建議、主控跟使用者說過，使用者沒有另外點頭。）
- 段 6 的公開 commit 帶了 VM 的 instance 名（＝GCP 專案 id）：使用者 2026-10-29 選「改寫歷史（建議）」（主控 session），主控 amend 成 `eee6b6e`、`push --force-with-lease`。
- 段 7 第 1 題（guard 兩處多問：`project.json` 壞掉＝最嚴預設＋碰 Firebase／`gcloud`／`git push` 一律要問；`firebase use <認不出的>` 要問、`firebase use default` 改回不問）：使用者 2026-10-29「照建議」（主控 session）。段 8 修。
- 段 7 第 2 題（上一個專案的兩份記憶、`MEMORY.md` 那兩行、`.local/README.md` 三段加「舊工具不要再叫」）：使用者 2026-10-29「改（建議）」（主控 session）。段 8 改；`.local/tools/` 不動。
- 段 7 第 3 題（force push 之前那個舊 commit 請 GitHub Support 清）：使用者 2026-10-29 先答「要清（建議）」，同一天問了「有必要嗎」、聽完主控說明後**改成「不送（建議）」**（主控 session）。接受那個舊 commit 留在 GitHub 上；`.local/github-support-request.md` 留著備用。
- 段 9 `mods.test.mjs:128`（`--check-mods` 的期待值 1 → 0）：主控 2026-10-29「照 A」（主控的決定，不是使用者）；spec「允許改的既有測試」已補。

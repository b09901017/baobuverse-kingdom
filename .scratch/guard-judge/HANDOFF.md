# guard 判斷刪東西 HANDOFF

分支 `claude/guard-judge`（從 `origin/main` `ad0a858` 開）。spec：`spec.md`。規劃：主控 `local_d2eb6981-cee2-4888-8ec7-6de35309d0fb`（另一個帳號，5 小時額度快用完才交出來）。
這一輪**只有一段**：使用者換帳號、開新對話（開場由 limit-guard 自動放進輸入框）、effort xhigh，從頭做到合併。沒有主控在跑：段自己判斷，最後回覆跟使用者說。

## 分段

| 段 | issue | effort | 狀態 |
|---|---|---|---|
| 0（規劃的帳號） | 15 a、b | — | ✅ 客廳 `2245538`；guard 73 → 75 |
| 1 | 14 → （額度允許）一個唯讀 subagent 審 14 → （額度允許）15 c～e → PR、合併 | xhigh | ✅ 14：客廳 `1729d41`、審查修的 `73ca1c4`；15 c `1d3f7ec`、d `6e144c7`、e `5ae884e`；guard 75 → 111（既有測試只拿掉 spec 准的一條）；額度 5 小時 36% 時做完 |

## 每一段共同的規矩

- 動工前讀：這份、`spec.md`、issue 14（與 15）、`CLAUDE.md`、`docs/agents/lessons.md`；`git fetch`、`git -C C:/Users/DELL/claude-home pull --ff-only`。
- **紅燈先**：新行為先寫失敗的測試、跑過確認紅，再修到綠。新測試放新檔（例如 `tests/judge.test.ts`），既有測試一條都不改；真的要改寫進 spec「允許改的既有測試」。
- **改 guard 的做法**：在客廳 `mods/guard` 改、在客廳跑 `claude plugin test .`；改完複製進 `~/.claude/mods/guard`，在那裡跑 `npx -y -p typescript@5 tsc -p . --noEmit`（客廳那份沒有型別檔，tsc 要在 `~/.claude/mods` 跑）與 `claude plugin validate .`；
  兩份 `diff -rq --exclude=node_modules --exclude=types` 相同。客廳 commit、推 `main`（自動同步會先備份改到一半的檔：最後一個 commit 完整就好）。這個對話載入的是舊版 guard，新版要新開的對話才生效。
- **測試一支一支跑**（使用者的電腦曾經過熱斷電）。基準：guard 75（15 a、b 之後）、limit-guard 67、dash 59（`claude plugin test <mod>`）。客廳 `tools/` 這一輪不動就不用跑。
- **guard 會掃這個對話的指令**：測試字串寫 firebase、`git push` 國王日記的，用 Write／Edit 寫測試檔（不要 `python - <<'EOF'`、`node -e`）；探針裡的字用拼的（`'fire'+'base'`）。被跳框照實跟使用者說是測試字串，不要換寫法繞。
  改筆記、issue、spec、HANDOFF 一律用 Edit／Write。
- **公開 repo**（這個）：commit、`.scratch`、PR 不帶真名、帳號、email、金鑰、VM host／GCP 專案 id／zone／instance 名。
- 中途發現的事不岔出去修，記進下面「中途發現」；會壞東西的先問使用者。subagent 同時最多兩個。
- 改一個函式、一段框上的字之前，grep 所有用到它的地方（`reasons`、`ask`、`judge`、`describe`、`Gone` 在 classify／removals／register 與測試都有用到）。
- **額度**：`get_usage` 看 5 小時額度。14 做完時 ≤ 50% 才開審查的 subagent（只看 14 的 diff 與 issue 判準，回報不改檔，你自己對過再修）；做完審查 ≤ 65% 才開始 15，一小條一個 commit，到 80% 就停在一條的邊界。
  **85% 一定開始收尾**（PR、合併）。真的做不完：commit、推，HANDOFF 寫「段 1 續的開場」，照 limit-guard 存開場 JSON（`~/.claude/mods-data/handoffs/baobuverse-kingdom/<時間>.json`），跟使用者說。
- 合併照 `CLAUDE.md`：這個 repo 沒有 CI，以這一段的驗證全過、PR 沒衝突為準，直接合進 `main`。PR 基底 `origin/main`。

## 過目

kickoff 的「唯讀 subagent 過目」這一輪沒做：規劃的帳號額度剩不到四成，留給實作那一段（14 做完之後的審查 subagent 代替）。
主控自己對過的（2026-10-30）：
- `$.model.fork({ prompt })` 只收 `prompt`、沒有逾時參數（要自己 `Promise.race`）；`nothing-to-fork` 在新對話第一輪；`$.model.complete` 收 `model`、`prompt`、`system`；`$.session.model()` 回主線的模型。
- 測試可以 `on('model.fork', …)`、`on('model.complete', …)` 模擬（型別的事件表裡有）。
- Bash 工具輸入有 `description?: string`。
- 客廳 guard 現在 73 條測試（`b296209` 之後）。
- **實測**（scratchpad 的 guard 複本，在 `guardShell` 開頭加 `try { await $.model.fork({ prompt }) } catch {}`，跑完就刪了）：既有測試沒有 `model.fork` 的處理，`$.model.fork` 會**丟一個接得住的錯**，guard 不會壞；72 過 1 紅。
  紅的是 `guard.test.ts`「讀正式站：不跳框…什麼都沒碰的一輪不講話」：它數 `ui.log`，探針多印了一行。所以：
  ① 模型那一步一定包 `try/catch`，丟錯＝判斷失敗＝照現在的框問；
  ② **判斷失敗的框要保留現在 `describe` 那一行原字**（`・刪 2 個：draft.txt（沒進 git，救不回來）；…`）再加「Claude 沒判斷成」那一行：`recoverable.test.ts:208,220` 用 `toMatch` 比這幾個字，保留就不用改既有測試；
  ③ 只有真的有「判斷」項目才叫模型（判準 7、10），而且不要在每個指令都 `ui.log`。

## 中途發現

（段寫：`### 段 1`，表格「# | 哪裡 | 什麼情境會錯 | 建議」）

### 段 1

| # | 哪裡 | 什麼情境會錯 | 建議 |
|---|---|---|---|
| 1 | 客廳 `classify.ts` `deletes()` 的 git 那幾條 regex | `git -C <資料夾> reset --hard`、`git -C x clean -fd`、`git -C x branch -D y`、`git -C x checkout -- a`（`git` 後面先接全域旗標）**完全不算刪東西**，13 之前就這樣（regex 要 `git` 後面直接接子指令）。git push 那幾條有認 `-C`，這幾條沒有 | 下一輪：這幾條也允許 `git` 後面接 `-C <資料夾>`／`-c k=v` 這種全域旗標（多問；交給 14 的模型判斷） |
| 2 | 14 的 fork 看得到什麼 | `$.model.fork` 接的是主線**上一次送出的那一份**：看得到之前的工具結果，看不到 Claude 這一則正在寫的字（下這個指令之前的想法）。所以另外送 `description`。subagent 跑的刪除，fork 看的也是主線的對話（不是 subagent 的），多半會判斷成要問（安全的那一邊） | 不用修；記著。真的常常多問再看要不要把 subagent 的說明也送進去 |
| 3 | 14 新對話第一輪 | 第一輪沒得 fork，改用 `$.model.complete`（沒有對話內容），模型只看得到指令與路徑，多半會說要問 | 不用修（照 issue）；新對話的第一個刪除比較常跳框是預期的 |
| 4 | 審查第 5 條、`require('fs').rmSync`（13 之前就有的兩個洞） | `rm -rf "$TEMP/.."` 被當暫存區放行；`require('fs').rmSync(…)` 不算刪東西 | **已順手修**（客廳 `73ca1c4`，在正在改的 `byPath`／`deletes()`，都是多問），寫在 issue 14「做完時留下的」 |
| 6 | 合併後修 git -C 時看到的：`classify.ts` 推 main 那條、`barePush`、register `branchRisks` | `git -C x push origin main`、`git -C x push`（現在在 main）：推 main ＝ 部署正式站（`mainDeploysProd`，沒有 project.json 的資料夾也是）認不出，不問 | 下一輪：跟 `4dd33a5` 一樣允許 git 後面接全域旗標；沒寫分支的要用 `-C` 的資料夾問 `git branch --show-current`（多問） |
| 5 | 14 等模型時的 hook 預算 | 型別說明 fork 跑的時候 hook 的 10 秒預算是停的；測試量不到（測試不計預算），還沒在真的對話裡跑過「fork 超過 10 秒」 | PR 手動檢查清單一條：在長一點的對話裡刪沒進 git 的檔，看會不會出「檢查這一行指令時出錯了」。真的會就改成不等模型、照 13 的框問 |

## 要使用者決定的

（段寫；一次一題、附建議）

- 段 1 最後回覆問了：主控提的三條保險（底線照樣問、判斷失敗就問、自己刪的留紀錄）要不要拿掉。段的建議：都留著（底線那條在審查之後是擋住「`rm -rf *` 在專案根目錄、模型說可以就整個不見」的唯一一道）。✅ 她答「都留著」（2026-10-30），記在下面「使用者已經決定的」。

## 下一輪要做的

- [x] 中途發現 1：`git -C <資料夾> reset --hard`／`clean`／`branch -D`／`checkout --` 不算刪東西（`git` 後面接全域旗標就認不出；13 之前就有）。多問、小。
  ✅ 合併後使用者說「好，修」（2026-10-30），客廳 `4dd33a5`：`-C`、`-c`、`--git-dir=`、`--work-tree=`、`--no-pager` 之類的全域旗標後面接的那五種都算刪東西、交給 Claude 判斷；`-C` 指到 `~/.claude`、`.local` 這種底線的地方一定問；git 狀態從 `-C` 那個資料夾讀。guard 111 → 113。
- [ ] 中途發現 6：同樣的形狀在「寫正式站」那邊：`git -C x push origin main`（推 main ＝ 部署正式站，沒有 project.json 的資料夾照最嚴的規則）認不出；`barePush`、`branchRisks` 也不看 `-C`。多問、小，跟上一條一樣換成允許全域旗標的 regex；`branchRisks` 要用 `-C` 的資料夾問現在的分支。
- [ ] 中途發現 5：新對話裡實際刪一個沒進 git 的檔（對話長一點，fork 要久一點），確認不會出「檢查這一行指令時出錯了」（hook 10 秒預算在等模型時有沒有停）。PR 的手動檢查清單有這一條。
- [ ] 15 d 留下的：shell 腳本裡的刪檔案不看（跟 node／python 腳本一樣）。要看的話，腳本內容的刪除要能交給 14 的模型（現在只有指令本身的刪除有位置可以對）。
- [ ] 工具收尾段 1 第 2 條：`gcloud firestore export` 要不要問（要使用者決定，這一輪照 issue 15 不做）。
- [ ] 用一陣子之後看「Claude 自己判斷刪了」的紀錄：有沒有該問卻沒問的、或幾乎都在問（新對話第一輪沒有對話內容，會比較常問）。

## 使用者已經決定的

- 2026-10-30：guard 刪東西改成「程式粗篩 → Claude 判斷 → 判斷要問的才問、寫白話」；「我都交給你判斷」；用另一個帳號一段做完、xhigh。原話在 `spec.md`。
- 主控提的三條保險（底線照樣問、判斷失敗就問、自己刪的留紀錄）：規劃時使用者沒有反對；段 1 做完問她要不要拿掉，2026-10-30 她答「都留著」。

## 段 1 的開場

```
這一輪在做：guard 刪東西改成「程式粗篩 → Claude 判斷 → 判斷是重要的才問使用者、寫白話」，加上有額度才做的幾個 guard 小洞。
分支 claude/guard-judge（從 origin/main ad0a858 開；規劃的 commit 在上面）。這是唯一的一段：做 issue 14 →（額度允許）唯讀 subagent 審 14 →（額度允許）15 c～e（a、b 規劃的帳號已做，客廳 2245538）→ PR、合併。
程式在客廳 C:/Users/DELL/claude-home 的 mods/guard（~/.claude/mods/guard 是正在用的那份）。

先讀：.scratch/guard-judge/HANDOFF.md（全部，特別是「每一段共同的規矩」的額度門檻）、spec.md（全部：使用者原話、三種分法、不能違反）、issues/14、issues/15；
CLAUDE.md；docs/agents/lessons.md；.scratch/tooling-leftovers/issues/13-guard-deletes-recoverable.md 的「做完時留下的」。
先切到分支：git fetch、git switch claude/guard-judge（本機沒有就 git switch -c claude/guard-judge origin/claude/guard-judge）；git -C C:/Users/DELL/claude-home pull --ff-only。

照「整輪都適用的規矩」：改函式或框上的字之前 grep 所有用到它的地方；中途發現的不岔出去修，記進 HANDOFF；subagent 同時最多兩個；紅燈先；測試一支一支跑。
沒有主控：不要開 session。要決定的自己照 spec 判斷；只有會壞東西、或推翻 spec 的才問使用者（一次一題、附建議）。

要特別注意：
- 14 是「少問」的改動：判準 3（底線）、4（判斷失敗不放行）、5（寫正式站／國王日記照舊問）是最重要的守住測試，一條都不能漏。
- 模型那一步不送檔案內容；拿不準就問。
- 新對話才載入新版 guard：這個對話看不到效果，靠測試。PR 內文的手動檢查清單寫使用者要在新對話點的路（例如：請 Claude 在 scratchpad 建一個檔再刪 → 不跳框；請它刪你自己寫、沒 commit 的筆記 → 跳框、框上有白話）。

做完要交：14（與做了的 15 列）各一個 commit（這個 repo；客廳照規矩）、Status: done、issue 底下「做完時留下的」、spec「行為會變的」「允許改的既有測試」、guard 測試數；
共用偏好兩處改好（客廳 user/CLAUDE.md 與 ~/.claude/CLAUDE.md 雜湊相同）；HANDOFF 分段表 ✅、中途發現、「下一輪要做的」；PR（內文用 pr skill）、合併進 main。
額度到 85%：停在可以交接的地方，commit、推，寫「段 1 續的開場」並照 limit-guard 存開場 JSON。
最後回覆用繁體中文：用一兩句白話說改了什麼、刪東西現在會怎麼走（附框的改前改後例子）、三條保險要不要拿掉、卡在哪。建議 effort：xhigh。
```

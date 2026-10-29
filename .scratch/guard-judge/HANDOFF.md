# guard 判斷刪東西 HANDOFF

分支 `claude/guard-judge`（從 `origin/main` `ad0a858` 開）。spec：`spec.md`。規劃：主控 `local_d2eb6981-cee2-4888-8ec7-6de35309d0fb`（另一個帳號，5 小時額度快用完才交出來）。
這一輪**只有一段**：使用者換帳號、開新對話（開場由 limit-guard 自動放進輸入框）、effort xhigh，從頭做到合併。沒有主控在跑：段自己判斷，最後回覆跟使用者說。

## 分段

| 段 | issue | effort | 狀態 |
|---|---|---|---|
| 1 | 14 → （額度允許）一個唯讀 subagent 審 14 → （額度允許）15 a～e → PR、合併 | xhigh | ⬜ |

## 每一段共同的規矩

- 動工前讀：這份、`spec.md`、issue 14（與 15）、`CLAUDE.md`、`docs/agents/lessons.md`；`git fetch`、`git -C C:/Users/DELL/claude-home pull --ff-only`。
- **紅燈先**：新行為先寫失敗的測試、跑過確認紅，再修到綠。新測試放新檔（例如 `tests/judge.test.ts`），既有測試一條都不改；真的要改寫進 spec「允許改的既有測試」。
- **改 guard 的做法**：在客廳 `mods/guard` 改、在客廳跑 `claude plugin test .`；改完複製進 `~/.claude/mods/guard`，在那裡跑 `npx -y -p typescript@5 tsc -p . --noEmit`（客廳那份沒有型別檔，tsc 要在 `~/.claude/mods` 跑）與 `claude plugin validate .`；
  兩份 `diff -rq --exclude=node_modules --exclude=types` 相同。客廳 commit、推 `main`（自動同步會先備份改到一半的檔：最後一個 commit 完整就好）。這個對話載入的是舊版 guard，新版要新開的對話才生效。
- **測試一支一支跑**（使用者的電腦曾經過熱斷電）。基準：guard 73、limit-guard 67、dash 59（`claude plugin test <mod>`）。客廳 `tools/` 這一輪不動就不用跑。
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

## 中途發現

（段寫：`### 段 1`，表格「# | 哪裡 | 什麼情境會錯 | 建議」）

## 要使用者決定的

（段寫；一次一題、附建議）

## 使用者已經決定的

- 2026-10-30：guard 刪東西改成「程式粗篩 → Claude 判斷 → 判斷要問的才問、寫白話」；「我都交給你判斷」；用另一個帳號一段做完、xhigh。原話在 `spec.md`。
- 主控提的三條保險（底線照樣問、判斷失敗就問、自己刪的留紀錄）：使用者沒有反對，**不是**使用者確認過的決定。最後回覆要跟使用者說有這三條，問要不要拿掉。

## 段 1 的開場

```
這一輪在做：guard 刪東西改成「程式粗篩 → Claude 判斷 → 判斷是重要的才問使用者、寫白話」，加上有額度才做的幾個 guard 小洞。
分支 claude/guard-judge（從 origin/main ad0a858 開；規劃的 commit 在上面）。這是唯一的一段：做 issue 14 →（額度允許）唯讀 subagent 審 14 →（額度允許）15 a～e → PR、合併。
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

# 14 guard：刪東西先讓 Claude 判斷，判斷是重要的才問（白話）

Status: todo
Blocked by: 無（工具收尾 13、段 9 修的與 `b296209` 都已在客廳 main）
動工前先讀：`../spec.md`（全部）；`../HANDOFF.md`「每一段共同的規矩」；`../../tooling-leftovers/issues/13-guard-deletes-recoverable.md`（「做完時留下的」）；
客廳 `mods/guard/hooks/removals.ts`（`byPath`、`byGit`、`judge`、`describe`、`BUILD`）、`hooks/classify.ts`（`Risk`、`Gone`、`deletes`、`reasons`、`KIND_WORD`）、`hooks/register.ts`（`ask`、`goneOf`、`guardShell`、`summary`、`decisions`、Bash／PowerShell 的 `tool.call`）；
`tests/recoverable.test.ts`（「接起來」那幾條：怎麼掛 plugin、模擬 `ui.ask` 與 git）、`tests/review-holes.test.ts`、`tests/leftovers.test.ts`；
mod 的型別 `~/.claude/mods/guard/.claude-plugin/types/claude-code/index.d.ts`：`$.model.fork`（約 `:2674-2691`）、`ModelForkResult`（`nothing-to-fork`）、`$.model.complete`、`$.session.model()`；測試用 `on('model.fork', …)`／`on('model.complete', …)` 模擬（事件表約 `:7040-7052`、`:7409-7411`）。

## 使用者要的

原話見 `../spec.md`「使用者的原話」（三段，逐字）。重點：救不救得回來對她沒有參考意義；她只想不要刪到重要的文件、檔案、資料；`tmp/`、「看不出要刪什麼」不用問她；Claude 判斷可以刪就直接刪，判斷要問的才問，而且寫白話（是什麼、影響什麼）。

## 為什麼會這樣

- 13 之後，guard 照「救不救得回來」分：救得回來（暫存區、建置產物、git 追蹤沒改過）不問；其他一律問，框上寫 `刪 tmp/draft.md（沒進 git，救不回來）`（`removals.ts` `describe`）。
- guard 是固定規則的程式，看不懂檔案是做什麼的。看得懂的是下指令的 Claude：它知道 `tmp/draft.md` 是剛剛自己建的探針，還是使用者的筆記。
- mod 可以叫模型：`$.model.fork({ prompt })` 拿這個對話主線最後送出的那一份（同一個模型、走 prompt cache）再接一則訊息，工具一律不准用；
  還沒有任何一輪跑完時回 `nothing-to-fork`（新對話的第一輪）。`$.model.complete({ model, prompt })` 沒有對話內容。
- Bash／PowerShell 的工具輸入有 `description`（Claude 寫的那一行說明），guard 讀得到。

## 做法（段可以改細節，改了寫進「做完時留下的」）

1. **分三種**（每一個刪除目標、每一種刪東西的指令）：
   - **放行**：13 判定救得回來的（`judge` 給 `null`）→ 照舊不問。
   - **底線**：`spec.md` 保險 1 那幾種 → 一定問使用者。金鑰檔名是新加的（現在 git 追蹤沒改過的 `.env` 會被 13 放行：這條是多問）。
   - **判斷**：其他所有 `kind: 'delete'`：沒進 git、改過沒 commit、專案外、萬用字元、看不出要刪什麼、`cd x; rm y`、程式裡刪檔案、`git clean`、`git reset --hard`、`git checkout --`／`restore`、`git branch -D`、強推／刪遠端分支。
2. **判斷**：一個指令只叫一次模型，把這個指令所有「判斷」的項目一起送。
   - 先 `$.model.fork`；`nothing-to-fork` → `$.model.complete`（模型用 `$.session.model()`，沒有對話內容）。
   - 送的事實：指令原文、Claude 寫的 `description`、每一項的路徑（相對專案）、檔案或資料夾、git 狀態、大小／檔案數、最後修改時間（幾分鐘前）。**不送檔案內容**（省錢，也不讓檔案裡的字左右判斷）。
   - 提示的原則：使用者幾乎都會同意，她只在意會不會刪到重要的東西（她自己寫的文件、資料、設定、還沒 commit 的工作、備份）；這個對話自己建的過程檔、探針、測試輸出就是不重要；**拿不準就問**。
   - 回答格式：只回 JSON，每一項 `{ decision: 'delete' | 'ask', what, effect }`（繁體中文白話，各一句）＋整體 `advice`。讀不懂就當失敗。
   - 逾時（建議 45 秒，`Promise.race`）、API 錯、`empty-reply`、`aborted`、讀不懂 → 失敗 → 照現在的框問，多一行「Claude 沒判斷成：<原因>」。
3. **結果**：全部 `delete` 而且這個指令沒有別種風險 → 不跳框、照跑，記進這一輪摘要；有任何 `ask`、底線、或別種風險 → 跳框，框上只列要問的項目（模型說 `delete` 的不列）。
4. **框上的字**（建議，段可以調）：
   ```
   Claude 要刪東西，要讓它做嗎？
   ・tmp/notes：<what>。刪了：<effect>
   Claude 的建議：<advice>
   （這個指令 Claude 說是要：<description>）

   指令：…
   ```
   底線那一項寫「一定問你：<現在 byPath 的理由>」，what／effect 也請模型寫（它不決定）。別種風險（寫正式站…）的行照現在。
5. **摘要**：「🛡 這一輪」加「Claude 自己判斷刪了：tmp/notes（測試用的暫存）」；`decisions` 分清楚是使用者允許還是 Claude 自己判斷。
6. 共用偏好：照 `spec.md`「共用偏好要跟著改的」改客廳 `user/CLAUDE.md`、複製到 `~/.claude/CLAUDE.md`。

## 判準（每條寫成測試；「照舊要問」的是守住的綠燈測試）

| # | 問句 | 預期 |
|---|---|---|
| 1 | 沒進 git 的 `tmp/notes`，模型回 `delete` → 會不會跳框？ | 不跳、照跑，摘要有一行 |
| 2 | 同上，模型回 `ask` → 框上有沒有 what／effect／advice、還寫不寫「救不回來」？ | 跳框；有白話；不以「救不回來」當理由 |
| 3 | `rm -rf .local/x`、`rm -rf .git`、`rm -rf ~/.claude/mods`、`rm -rf <專案根>`、`rm .env`（git 追蹤沒改過），模型回 `delete` → 會不會不問？ | **照舊問**（底線） |
| 4 | 模型逾時／API 錯／`nothing-to-fork` 又 `complete` 失敗／回的不是 JSON → 會不會放行？ | **不放行**，照現在的框問，多一行原因 |
| 5 | 同一串有刪東西（模型說 `delete`）又有 `firebase deploy --project baobu-app`／`git push` 國王日記 → 會不會不問？ | **照舊問**，框上只有那條 Firebase／neverWrite |
| 6 | `rm a b c`：模型回 a、c `delete`、b `ask` → 框上列幾項？ | 只列 b |
| 7 | 救得回來的（暫存區、建置產物、git 追蹤沒改過）會不會去叫模型？ | 不叫（省錢、不變慢） |
| 8 | 新對話第一輪（`nothing-to-fork`）→ 有沒有改用 `complete`？ | 有 |
| 9 | PowerShell `Remove-Item` 走同一套嗎？ | 是 |
| 10 | 沒有刪東西的指令會不會叫模型？ | 不會 |
| 11 | guard 既有測試（73）一條都沒改，全過嗎？ | 是（要改的寫進 spec「允許改的既有測試」） |
| 12 | `~/.claude/CLAUDE.md` 跟客廳 `user/CLAUDE.md` 雜湊一樣嗎？「先問再做」與「刪東西的指令說明」兩處改了嗎？ | 是 |

## 不做

- 不送檔案內容給模型。不改寫正式站／`neverWrite`／傳出去／付錢的判斷。
- 不改 13 判定「救得回來」的規則（那一層照舊）。

## 做完時留下的

（段寫）

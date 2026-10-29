# 14 guard：刪東西先讓 Claude 判斷，判斷是重要的才問（白話）

Status: done
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
| 11 | guard 既有測試（75，15 a、b 之後）一條都沒改，全過嗎？ | 是（要改的寫進 spec「允許改的既有測試」） |
| 12 | `~/.claude/CLAUDE.md` 跟客廳 `user/CLAUDE.md` 雜湊一樣嗎？「先問再做」與「刪東西的指令說明」兩處改了嗎？ | 是 |

## 不做

- 不送檔案內容給模型。不改寫正式站／`neverWrite`／傳出去／付錢的判斷。
- 不改 13 判定「救得回來」的規則（那一層照舊）。

## 做完時留下的

（段 1，客廳 `1729d41`、審查修的 `73ca1c4`；guard 75 → 109，既有 75 條一字未改；tsc 0 錯、validate 過；limit-guard 67、dash 59 照過）

- **怎麼放**：新檔 `hooks/weigh.ts`（純函式）：`items`（risks＋removals 的下場 → 要交給模型的每一項）、`prompt`、`parse`、`apply`、`gitState`、`failed`。
  `removals.ts`：`Fate.must`（底線）、新的 `fated()`（每個目標的下場；`judge()` 改成用它，輸出照舊）。`classify.ts`：傳了 `gone` 時刪東西的 Risk 多一個 `at`（位置），沒傳就跟以前一模一樣（legacy-parity 照過）。
  `register.ts`：`goneOf` 一律給 `gone`（沒有刪檔案就是空的，才會標位置）；`weighOf` 叫模型、改 risks；`ask` 多一個 `notes`（理由底下的幾行）；摘要多「Claude 自己判斷刪了」。
- **一項是什麼**：rm／Remove-Item 一個目標一項（救得回來的不列）；看不出刪什麼的整段、`git clean`、`git reset --hard`、`git checkout --`／`restore`、`git branch -D`、強推、程式裡刪檔案，一段一項。
- **送給模型的**：指令（前 2000 字）、在哪個資料夾跑、Claude 寫的 `description`、每一項的名字（專案裡寫相對路徑、家目錄裡寫 `~/…`）、git 狀態（13 的白話）、檔案或資料夾、大小、資料夾第一層幾項、最後修改幾分鐘前（`$.fs.stat`／`list`，看不到就不寫）。
  `git reset --hard`、`git clean`、`git checkout --`／`restore` 另外附上現在沒 commit 的修改與沒追蹤的檔（各列前 5 個**檔名**）——它們丟掉的是整個 repo 沒 commit 的東西，光看指令看不出來（issue 沒寫，段加的）。**不送檔案內容。**
- **叫模型**：`$.model.fork`；`nothing-to-fork` → `$.model.complete`（`$.session.model()`、`maxTokens` 4096、`timeoutMs` 45 秒）。
  fork 沒有逾時參數：用 `$.clock.after(45 秒)` 跟它 `Promise.race`（不用 `$.clock.sleep`：hook 自己只有 10 秒預算，`sleep` 會吃預算；`after` 不必 await）。計時器叫不起來就不計時。
  探針（scratchpad 裡丟掉的 mod，跑完刪了）：測試裡沒人接 `model.fork` → 丟一個接得住的錯；`clock.after` 可以模擬成馬上到時或永遠不到，沒人接就不觸發、不會讓測試變紅；`Date.now()` 能用。
- **回答**：只認 `{"items":[{id, decision, what, effect}…], "advice"}`（前後有字也行，取第一個 `{` 到最後一個 `}`）；decision 不是 delete／ask、what／effect 是空的、少了一項 → 讀不懂 → 失敗。一個指令超過 30 項不叫模型、當失敗。
- **框上的字**（要問的時候；底線那一項後面加「一定問你：<理由>」）：
  ```
  Claude 要刪東西，要讓它做嗎？
  ・tmp/notes：<是什麼>。刪了：<影響什麼>
  Claude 的建議：<advice>
  （這個指令 Claude 說是要：<description>）

  指令：rm -rf tmp/notes
  ```
  失敗時照 13 的框（`・刪 draft.txt（沒進 git，救不回來）`），底下多「Claude 沒判斷成：<叫不到模型／API 出錯（529 overloaded）／模型沒有回答／被中斷了／等了 45 秒沒有回答／回答讀不懂…>」與說明那一行。
  只有別種風險（寫國王日記…）要問、刪的部分模型說可以：框上只有那一條，沒有建議、說明那兩行。
- **摘要**：`🛡 這一輪` 底下多一行 `  Claude 自己判斷刪了：tmp/notes（<what>）、…`（前 10 項＋「等 N 項」）；只在指令真的跑了才記（她按不要就不記）。「你允許了」那一行同一個 why 只寫一次（一個 rm 拆成好幾項要問時不重複）。

跟 issue 寫的不同（段自己判斷，最後回覆跟使用者說）：

1. **底線多兩種**（多問）：資料夾裡有金鑰檔名的檔（看 git 的 ls-files／status 輸出）；萬用字元前面那段資料夾是底線的地方（專案根目錄的 `rm -rf *`、`./*.md`、`.local/*`、`~/*`、PowerShell `Remove-Item *`）。
   不加的話，`rm -rf *` 在專案根目錄會交給模型，模型說可以刪就整個專案不見、不跳框。13 本來就問萬用字元，所以這兩種對 13 來說不是多問、只是不交給模型。
2. 金鑰檔名在暫存區也算底線（`rm $TEMP/x/server.pem` 13 不問、現在問）；檔名照 spec：`.env` 開頭（含 `.env.example`）、`.pem`、`.key`（Keynote 的檔也算）、`-sa.json`、`credentials…json`。
3. 第 4 步建議的「Claude 沒判斷成」那一行之外，框上也放說明那一行（失敗時也放）。

**段 1 審查**（14 做完開一個唯讀 subagent 審 `1729d41`；它找到的 5 條段自己對過程式、都是真的，修在客廳 `73ca1c4`；guard 101 → 109，都是多問）：

| # | 情境 | 修成 |
|---|---|---|
| 1 | `cd` 之後看不出在哪個資料夾（`cd ~; rm -rf .claude`、`cd x; rm -rf .git`、PowerShell 前面有 `Set-Location`）：底線靠路徑判斷，路徑算不出來就交給模型了 | 看寫的字：有 `.git`／`.local`／`.claude`、金鑰檔名、`~`、`.`／`..` → 底線；相對路徑的萬用字元（`cd x; rm -rf *`）→ 底線。字上看不出的（`cd x; rm notes.md`）照樣交給模型 |
| 2 | 刪檔寫在程式裡、交給別的指令（`python -c "…rmtree('.git')"`、`bash -c "rm -rf .local"`、`find ~ … -exec rm`、`Get-ChildItem .git \| Remove-Item`）：一律交給模型 | 整個指令的字有上面那幾種 → 底線（`removals.ts` 的 `mustWord`）。git 那幾種刪東西不看字（指令裡本來就有 git） |
| 3 | `git clean -x`／`-X` 連被 ignore 的 `.env.local`、金鑰、`.local` 一起刪，送給模型的 git 狀態卻看不到 ignore 的檔 | `-x`／`-X` → 底線；沒有 `-x` 但現在沒追蹤的檔裡有金鑰檔名 → 底線（看整個 repo，不管 git clean 後面有沒有限定路徑：多問） |
| 4 | 模型回答同一個 id 兩次，後面蓋前面；`"id": true` 被當成 1 | id 重複、不是整數（或數字字串）→ 讀不懂 → 照 13 的框問 |
| 5 | `rm -rf "$TEMP/.."`、`rm -rf /tmp/../..`、`Remove-Item -Recurse "$env:TEMP\.."`：寫的字像暫存區就放行，實際刪的是整個 `AppData/Local`（**13 就有的洞**，在正在改的 `byPath`，順手修） | 寫的字有 `..` 就只認算好的路徑在 TEMP 底下 |

順手修的另一個 13 之前就有的洞：`node -e "require('fs').rmSync(…)"`、import 進來的 `rmSync(…)` 不算刪東西（regex 要 `fs.` 緊接著）→ 現在算「程式裡刪檔案」（交給模型，字上有底線就一定問）。
審查也提醒的、還沒實測的：等模型時掛著 `$.clock.after`；照型別說明 fork 跑的時候 hook 的 10 秒預算是停的，沒有在真的對話裡跑過「fork 超過 10 秒」。真的不停的話，結果是 `.catch` 擋下、不跳框（多擋，不會放行）→ PR 的手動檢查清單有一條。
審查說測試沒蓋到的判準 3（PowerShell 不帶萬用字元的 `.git`、`rm -rf ~`）、判準 4（超過 30 項）、判準 5（寫正式站、傳出去、付錢、看不到內容各自配刪東西）都補了測試。

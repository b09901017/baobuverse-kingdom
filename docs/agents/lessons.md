# 踩過的坑：動工前先掃一遍

**不是規則清單**，是「之前的 session 一再犯、測試又沒抓到」的那幾種形狀。
踩到新的坑就照下面的格式往下加（標題是坑的形狀，一句話；內文是發生的例子；最後一行是動手前要問自己的那一句）。修好的例子留著，形狀不會過時。

---

## 一、「回家」會把家裡電腦切到 VM 上的分支：VM 很久沒照「出門」接手時，那個分支是舊的

發生的例子：2026-10-28，claude-home-workflow 第 3 題。主控為了對齊 VM 上上一個專案的 `.local`，開 VM、處理完，用上一個專案自己的 `devbox.mjs home` 關機。
「回家」照設計把家裡的程式碼切到「VM 用的分支」—— 但 VM 從 10/21 之後就沒有照「出門」接手過，停在舊分支 `claude/boot-card-staging-only`，
家裡原本在 `claude/availability-sheet-chart-no`，就這樣被切走了（工作目錄乾淨，沒東西不見，主控切回去）。
測試沒抓到：devbox 的測試只驗「切到 VM 的分支」這件事本身，沒有「VM 的分支比家裡舊」的情境；而且這次開 VM 不是為了在 VM 上工作，「回家」的前提（VM 上是最新的工作）不成立。

> 這次開 VM 是不是照「出門」接手過的？不是的話，關機不要按「回家」（用 `stop`），或先記下家裡每個專案的分支，關完對一次。

## 二、Bash 工具在交給 bash 之前就把 `\\` 變成 `\`：單引號、帶引號的 heredoc 都擋不住

發生的例子：2026-10-29，legacy-to-home 段 8 用 `python - <<'EOF'` 改 guard 的 `classify.ts`，程式裡寫 `\\b`，python 收到 `\b`（退格字元），兩個 regex 變成控制字元、5 支測試檔載不進來。當時以為是 heredoc 的問題。
工具收尾段 9 重現：直接在 Bash 工具裡跑 `printf '%s\n' 'x\\y'` 印出 `x\y`、`<<'EOF'` 裡的 `a\\b` 也剩一個；**同樣幾行寫成檔再 `bash 檔`，兩個反斜線都在**。單引號與 `<<'EOF'` 在 bash 本來就不處理反斜線，所以是 bash 之前那一層改的。

> 這段指令裡有沒有反斜線（regex、Windows 路徑、跳脫字元）？有的話用 Write／Edit 寫檔，或先把指令寫成檔再跑，寫完數一次反斜線。

## 三、Git Bash 的 `awk` 把 CRLF 變成 LF；查換行的指令也可能算錯

發生的例子：2026-10-29，legacy-to-home 段 8 續用 `awk` 改上一個專案的一份記憶，整份從 CRLF 變成 LF（用 python 換回、逐檔核對）。工具收尾段 9 重現：`printf 'a\r\nb\r\n'` 的檔經過 `awk '{print}'`，輸出只剩 `\n`。
工具收尾段 1 用 `printf "%s" $(grep -c $'\r' $f)` 查 guard 的檔是不是 CRLF，印出來的是**行數**，以為全是 CRLF，把 `classify.ts` 換成 CRLF、整份變成改過（commit 前發現、換回）。段 9 沒重現出同樣的數字，原因沒查到。

> 這個檔原本是什麼換行？改之前、改之後都用 python 讀 bytes 數 `\r\n`；改有 CRLF 的檔用 Edit，或用 python 讀寫 bytes，不要經過 `awk`、`sed`。

## 四、指令報錯了，不代表前半段沒跑

發生的例子：2026-10-29，legacy-to-home 段 8 續改上一個專案的記憶，指令裡有 `"$(… grep -c $'\r' …)"`，報 `unexpected EOF while looking for matching )`——但報錯之前那幾步已經跑完，第一份記憶其實已經改了。馬上查到才沒有重複插入。

> 這次報錯之前，指令前面做了什麼？先查檔案或 git 的狀態，再決定要不要重來。

## 五、指令的輸出、錯誤訊息，會把私人值和不該讀的東西印進對話

發生的例子：2026-10-29，legacy-to-home 段 3 在 scratchpad 的深路徑 clone 上一個專案的 `.local`，Windows 路徑太長、checkout 失敗，git 的錯誤訊息印出 5 個 `references/` 底下的檔名（規矩是 `references/` 不讀）。
段 7 審查用 `grep -n` 查上一個專案的記憶，輸出帶出 VM 名稱、GCP 專案、zone。主控比對公開 repo 有沒有私人值時，比對的指令出錯，錯誤訊息把值印了出來。三次都只在對話裡、沒進檔案或 repo。

> 這個指令（包括它出錯的時候）會印出什麼？比對私人值用 spawnSync 讀檔、在程式裡比、只印筆數，不把值放進指令字串；查私人檔先 `grep -l`、`--numstat`，只看挑過的行；clone 用短路徑＋`core.longpaths=true`，錯誤導到檔案只算行數。

## 六、mod 的測試不是一般的 node 測試：`$` 叫不了模組裡的函式、不能 import 資料夾外的檔

發生的例子：2026-10-29，legacy-to-home 段 2 要測 limit-guard 讀帳號的函式：測試的 `$` 拿去呼叫模組裡的函式，`$.env` 是 undefined；改成傳變數名字給 `$.env.get`，整個模組載不進來。最後把讀帳號抽成 `hooks/accounts.ts`、吃一個小的 `Io`。
工具收尾段 9 用一個丟掉的 mod 重現兩件：`TypeError: undefined is not an object (evaluating '$.env.get')`；`claude plugin validate` 說 `$.env.get` 的第一個參數要寫字面上的名字。
工具收尾段 4 想讓 dash 與 limit-guard 共用同一份假資料，mod 的測試 import 不到自己資料夾外的檔（`… it is outside the plugin's folder`）；只有客廳 `tools/` 的 node 測試能 import mod 裡的 `.ts`。

> 要測的函式能不能抽出來、吃一個小的 `Io`？兩個 mod 要共用的假資料，是不是各放一份、再用 `tools/` 的測試比逐字相同？

## 七、寫來測 guard 的字串，guard 也會當成真的指令

發生的例子：2026-10-29，legacy-to-home 段 8 用 python heredoc 改 guard 的測試檔，heredoc 裡的測試字串（推國王日記的 repo、匯入國王日記的專案）被當成真的指令，跳出「要寫絕對不能寫的地方」的框，使用者嚇了一跳去問主控。
工具收尾段 3b 續用 python heredoc 改 issue，程式裡寫到 `rm`，框上同一句「看不出要刪什麼」重複 6 行。段 8 審查的 subagent 在 scratchpad 寫探針、測試字串直接寫 firebase 指令再用 `node` 跑：guard 本來就會讀 `node` 腳本的內容，跳了幾次框；段 8 自己的探針把字拼起來（`'fire'+'base'`）就沒跳。

> 這串指令或它要跑的腳本裡，有沒有 firebase、`git push`、`rm` 這種字？改測試檔、筆記用 Write／Edit；探針裡的測試字串用拼的；真的會跳框，先跟使用者說「等一下會跳框，是測試字串」。

## 八、對話紀錄會被清掉：量到的結果只寫歸納，之後就重現不了

發生的例子：2026-10-29，工具收尾段 5 要照 09-09 的實驗「先跑那 10 個在 3 個 worker 下紅的檔」，但那個對話已經不在了（留下的最早是 10-05），issue 只寫了紅的「形狀」，commit 只點名 4 個，剩下 6 個找不回來。

> 這次量到的結果，原始清單（檔名、測試名、數字、指令）寫進 issue 或 commit 了嗎？只在對話裡的，過幾週就沒了。

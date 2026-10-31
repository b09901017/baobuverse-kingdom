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

2026-10-30 階段 0 段三：Bash 工具的 heredoc 裡有 JS 樣板字串（反引號＋`${…}`），整段報 `unexpected EOF while looking for matching`、什麼都沒跑；同樣的程式寫成檔再跑就好。
段六用簡單的樣板字串（`<<'EOF'` 寫檔、`node - <<'EOF'`、包在 `$(…)` 裡）重現不出來，原因沒查到，先當成同一類。

> 這段指令裡有沒有反斜線（regex、Windows 路徑、跳脫字元）或一整段程式碼？有的話用 Write／Edit 寫檔，或先把指令寫成檔再跑，寫完數一次反斜線。

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

2026-10-30 記帳討論：主控叫 subagent「把這些字拆開來寫、免得跳框」，auto mode 把整個派工當成繞過檢查擋了兩次（就算使用者已經答應那件事）。
拆字躲框在檢查看來就是躲檢查；之後**不拆字**，改成跳框前先講。

> 這串指令或它要跑的腳本裡，有沒有 firebase、`git push`、`rm` 這種字？改測試檔、筆記用 Write／Edit；**不要拆字躲檢查**；真的會跳框，先跟使用者說「等一下會跳框，是測試字串」。

## 八、對話紀錄會被清掉：量到的結果只寫歸納，之後就重現不了

發生的例子：2026-10-29，工具收尾段 5 要照 09-09 的實驗「先跑那 10 個在 3 個 worker 下紅的檔」，但那個對話已經不在了（留下的最早是 10-05），issue 只寫了紅的「形狀」，commit 只點名 4 個，剩下 6 個找不回來。

> 這次量到的結果，原始清單（檔名、測試名、數字、指令）寫進 issue 或 commit 了嗎？只在對話裡的，過幾週就沒了。

## 九、scratchpad 的路徑太深：Windows 上 git、pnpm 會因為超過 260 字元壞掉

發生的例子：2026-10-29，legacy-to-home 段 3 在 scratchpad 的深路徑 clone，checkout 失敗（錯誤訊息見第五條）。
2026-10-30，階段 0 段一在 scratchpad 的深路徑 clone 跑 `pnpm verify`，pnpm 12 寫 `node_modules/.pnpm-task-run-state-v1/...` 時報「系統找不到指定的路徑」；改放 `%TEMP%\bkv` 這種短路徑就好（跑完刪掉）。

> 要另外 clone 一份來跑？放短路徑（`%TEMP%\` 底下兩三個字的資料夾），git 加 `core.longpaths=true`，跑完刪掉。

## 十、第一次就全過的測試，可能是空過

發生的例子：2026-10-30，階段 0 段四寫規則測試。讀伺服器上文件的小幫手包在 `@firebase/rules-unit-testing` 的 `withSecurityRulesDisabled` 裡，那個函式不回傳回呼的結果，小幫手永遠拿到 `undefined`，
「沒存進去」那支因此空過；同一輪另外兩支變紅才發現。規則測試第一次就 26 支全過，所以另外把規則放寬，確認該紅的會紅（3 支變紅、還原後全綠）。

> 這批測試第一次就全過？把要測的那條規則或程式故意弄壞，看它會不會紅；包在別人函式裡的小幫手，先確認它真的拿到值。

## 十一、本機與模擬器沒有的那一層，只在正式網址上壞：PWA 的 service worker 會攔同網域的每個網址

發生的例子：2026-10-30，階段 0 段五第一次部署後，正式網址按 Google 登入停在「載入中」：`vite-plugin-pwa` 預設把每個網頁導向換成 `index.html`，連 Firebase 的 `/__/auth/handler` 也是
（`vite.config.ts` 加 `navigateFallbackDenylist` 修好）。修好之後又跳 `redirect_uri_mismatch`：Google 的 OAuth 用戶端只認 `firebaseapp.com` 的網址，使用者在主控台加了 `web.app` 的。
測試、模擬器都抓不到：本機開發沒有 service worker，模擬器的登入頁在另一個 port。

> 這次改動有沒有只在正式網址才有的那一層（service worker、真的登入網域、快取標頭）？部署後在正式網址從登入走一次，不要只看模擬器。

## 十二、讀過私人檔再寫測試，會順手把裡面的字抄成測試資料

發生的例子：2026-10-31，階段 1 段一。為了做預設資料讀了 `.local/kingdom-accounts.md`（金額遮掉，字沒遮），接著寫 01 的備註測試，順手用了檔案裡兩個真實的帳戶用途備註當例子，還 commit 了。
issue 明明寫了「測試用假資料」，測試也全綠；是 03 最後比對私人值才抓到（還沒推，改掉重做那兩個 commit）。只比對「標籤、金額」會漏掉：寶的備註沒進 presets，要連原始表格的每一格一起比。

> 這批測試資料是我想的，還是剛才在私人檔看過的？推之前把私人檔每一格（名字、備註、金額）對 `git grep --untracked` 比一次，比完才 commit；測試的值一律寫得一看就是假的（假銀行、假備註）。

## 十三、在清單打「走過」，其實是腳本跳過去的

發生的例子：2026-10-31，階段 1 段四。手動驗收清單的模擬器那一欄打滿 ✓，實際上大多是用 JS 改網址、填欄位、送表單；第 24 步「封存後選單沒有它」看的還是寶的選單（誰出跟著上一筆變成寶），根本沒驗到。使用者問「你自己 e2e 跑過嗎」才更正，第二次照畫面走才真的驗到。
工具也會騙人：內建瀏覽器的畫面藏著時，手機大小的 `left_click` 用 ref 會點偏（點到別的按鈕），捲動過的截圖內容也會往下位移；`left_click_drag` 沒拖動也不報錯。

> 這個 ✓ 是照畫面點過去的，還是程式直接跳到那一步？看到的是我要驗的那個情境嗎？請使用者驗之前，先老實寫出「我走到哪、哪裡只有你走得到」；工具點完要讀畫面確認點到的是對的。

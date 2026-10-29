# 踩過的坑

都是上一個專案（`baobao-wellness-clinic-scheduler`）真的踩過的；每一條最後一行是動手前要問自己的那一句。

## 測試程式

**`.catch()` 會把逾時吞掉，看起來只像「這支就是慢」。** 一個連點測試的第 2～5 下點在已經消失的按鈕上，每一下燒滿 15 秒的 `actionTimeout`，一支 60 秒。
> 一支測試莫名其妙慢，先找 `.catch()`。

**`actionTimeout` 沒設，選錯的選擇器會安靜地吃滿整個測試逾時。** Playwright 的 `click()`／`fill()` 預設不逾時，一個 6 個測試的檔跑掉 18 分鐘而且看不出卡在哪一行。
> config 有沒有設 `actionTimeout`、`navigationTimeout`？

**「畫完了沒」的判準漏掉一種佔位字。** 只認得「載入中…」，有一頁用「掃描中…」，斷言讀到那三個字，錯誤訊息長得像 app 壞了。用一個掃原始碼的測試盯「佔位字清單」，它又抓出兩個沒人知道的。
> 等畫面穩定的那支函式，認得 app 裡全部的佔位字嗎？

**同一件事在兩個入口的選擇器不一樣。** 等一個不存在的選擇器，症狀是跑滿逾時然後紅在一句無關的斷言上。
> 改了等待條件，有沒有真的跑那一支？

## 跑的環境

**本機跑到一半不可以改被測的檔。** 模擬器的 hosting 即時從磁碟供檔，還沒跑到的測試會吃到新程式碼，結果無法解讀。要邊改邊跑就把那個 commit 開成暫存 worktree、從那裡起模擬器。
> 這一次跑的時候，有沒有東西在改 `public/`（或 app 的原始碼）？

**模擬器服務的是「啟動它的那個資料夾」，而且跑完不會自己關。** 在 worktree A 跑完、接著在 B 跑，B 沿用 A 還活著的模擬器，測到的全是 A 的程式碼（破綻：B 根本沒有的改動出現在失敗畫面裡）。
> 換資料夾跑之前，殘留的模擬器關了嗎？

**中斷之後 port 不會自己放掉。** 殺掉外層的 shell，Java 與 node 還活著，下一次報「port taken」。依 port 找行程停掉（PowerShell：`Get-NetTCPConnection -LocalPort <p> -State Listen` → `OwningProcess` → `Stop-Process -Force`；從 Bash 叫時整段用單引號包，`$_` 才不會先被 bash 吃掉）。
> 收尾時，模擬器、Java、瀏覽器的程序與 port 都確認沒了嗎？

**模擬器的 Functions 不會自己重載。** 改了 `functions/`，模擬器還是跑啟動那一刻的那一份，E2E 紅得像程式錯。
> 改了後端函式，有沒有重開模擬器？

**每個測試從 CDN 重抓一次前端 SDK。** 每個測試一個新的瀏覽器 context ＝ 一份新的 HTTP 快取；worker 越多同時打出去的請求越多，抓不到就整支紅（`ERR_SOCKET_NOT_CONNECTED`、`ERR_CONNECTION_RESET`，症狀是等不到登入按鈕）。單獨重跑那一支。
> 這支紅的是網路（CDN），還是 app？

**命令列的 `--reporter=…` 會整個換掉 config 裡的 reporter。** 帶了 `--reporter=list` 那一次就沒有 JSON 報表；而同一個資料夾裡另一個 `npx playwright test --list` 會寫一份「全部跳過、0 秒」的 JSON 蓋上去，量出來全是 0（2026-10-29 實驗踩到）。要兩種一起：`--reporter=list,json` 加 `PLAYWRIGHT_JSON_OUTPUT_FILE=<路徑>`。
> 這一次的 JSON 報表，真的是這一次跑出來的嗎（看檔案時間）？

**輸出被 pipe 緩衝到最後才吐。** 想看進度不要 `| grep | tail`，看 `test-results/` 有沒有長出失敗的資料夾。

## 工具與 CI

**`git diff --name-only` 會把中文路徑轉成八進位跳脫。** 對不上任何分級規則，於是每次都退回全跑，畫面上只寫「沒有登記」。一律帶 `-c core.quotepath=false`。
> 分級腳本吃的路徑，有沒有中文檔名？

**`upload-artifact@v4` 預設排掉隱藏檔。** `.artifacts/` 是點開頭的目錄，失敗證據從來沒上傳過，那一步卻是綠的。要 `include-hidden-files: true`。這種「綠著失敗」只有真的紅過一次才驗得到：驗分片時故意弄壞兩份。
> 這個「成功」的步驟，真的失敗過一次看看嗎？

**Windows 的 CRLF 讓掃原始碼的測試假紅。** `core.autocrlf=true` 新 checkout 出來是 CRLF，帶換行的樣式永遠對不上，CI（Linux）永遠綠。`.gitattributes` 一行 `* text=auto eol=lf`。
> 本機紅、CI 綠：是不是換行？

**`--related` 這種「跟某個 commit 比」在 rebase 之後不能拿舊 commit 當基底。** 那個 commit 不在新歷史上，退回比 merge-base，範圍一下變成整條分支。要補跑就點名檔案。

## 同機平行

**兩組模擬器同時啟動，兩組都卡住、一個字都沒印**（2026-10-29 實驗，Windows、firebase-tools 15.28，等了 3 分鐘）。一組起好（port 在聽）再開下一組就好，一組約 10 秒。
> 多組模擬器是一組一組開的嗎？

**收尾時外層的啟動腳本可能活下來。** `taskkill /T` 收掉了模擬器（port 都放了），開模擬器的那支 node 還在（2026-10-29 實驗）。收完再用指令列找一次，`Stop-Process -Force` 補刀，最後數一次殘留。
> 收完數過殘留的程序嗎（不只看 port）？

**Auth 模擬器分不了專案。** 它把 api key 丟掉、一律回 `--project` 那個預設專案：同一組模擬器裡，不管 app 的 config 寫哪個 projectId，登入都落在預設那一份。共用一組時要讓所有 worker 共用同一個測試帳號（建帳號冪等、不清 Auth）；一個 worker 一組時，清 Auth 要打那一組自己的專案。
> 清帳號、建帳號打的是哪一組、哪一個專案？

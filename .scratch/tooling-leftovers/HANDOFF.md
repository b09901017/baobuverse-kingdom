# 工具收尾 HANDOFF

分支 `claude/tooling-leftovers`（從 `claude/legacy-to-home` 的 `1de96ba` 開）。spec：`spec.md`。主控：`local_fba130a7-69e8-44e8-a663-406bab3cb262`（主控自己的筆記在 `.local/main-session-handoff.md`）。

## 分段

| 段 | issue | effort | 狀態 |
|---|---|---|---|
| 1 guard | 01 → 02 | xhigh（02 是這一輪唯一「少問」的改動，白名單與守住的測試很多） | ⬜ |
| 2 同步的兩個 git 行為 | 03 → 04 | xhigh（兩台同時寫 git 的紅燈測試） | ⬜ |
| 3 tools 整理 | 05 → 06 | high | ⬜ |
| 4 儀表板 | 07 | high（要截圖） | ⬜ |
| 5 E2E | 10 | high（每次跑之前使用者點頭） | ⬜ |
| 6 上一個專案 | 09 → 08 | high（08 中途要問使用者） | ⬜ |
| 7 VM | 12 | high（開 VM、花錢，主控開段前再提醒使用者） | ⬜ |
| 8 審查 | `/matt-code-review`：這個 repo `main...claude/tooling-leftovers`＋客廳這一輪的 commit＋上一個專案這一輪的 PR 與 `.local` commit | xhigh | ⬜ |
| 9 修審查、教訓、PR、合併 | 審查找到的、11、手動檢查清單、PR、合併 | high | ⬜ |

## 每一段共同的規矩

- 動工前讀：這份、`spec.md`、這一段的 issue、`CLAUDE.md`、`docs/agents/lessons.md`；前面幾支 issue 底下的「做完時留下的」。動工前 `git fetch`、`git -C C:/Users/DELL/claude-home pull --ff-only`。
- 一支 issue 一個 commit（這個 repo）；`Status:` 改 `done`，issue 底下寫「做完時留下的」（實際做成什麼樣子、跟 issue 寫的不同的地方）。每支做完就推（`origin claude/tooling-leftovers`；客廳推它的 `main`）。
- **紅燈先**：新行為先寫一支失敗的測試、跑過確認紅，再修到綠。
- **既有測試一條都不改**就要全過；要改的先停、用 SendMessage 問主控，主控同意後寫進 spec「允許改的既有測試」再改。行為有變的寫進 spec「行為會變的」。
- **改 `~/.claude/mods`**：tsc 0 錯（`npx -y -p typescript@5 tsc -p <mod 資料夾> --noEmit`；notify 沒有 tsconfig 不跑）、`claude plugin validate <mod 資料夾>` 過；
  改完複製進客廳 `mods/`、客廳 commit、推；客廳 `mods/` 跟 `~/.claude/mods` 逐檔相同（不算 `node_modules`、`.claude-plugin/types`）。客廳的自動同步會先把改到一半的檔備份成「自動同步」commit：**最後一個 commit 的狀態完整就好**。
- **測試一支一支跑**，不要平行全開（使用者的電腦曾經過熱斷電）。基準（2026-10-29 段 9 之後）：
  mods `claude plugin test <mod>`：guard 38、limit-guard 52、dash 38、e2e-progress 5、notify 6；
  客廳寫檔名：`node --test tools/autosync.test.mjs` 19、`tools/mods.test.mjs` 13、`tools/devbox.test.mjs` 14、`tools/devbox-mods.test.mjs` 22（**不要** `node --test tools/`）。
- **上一個專案**（`C:/Users/DELL/Desktop/baobao-wellness-clinic-scheduler`）：它的資料夾、分支、worktree、正在用的設定都不動；`.local/references/` 不讀；記憶用 `grep -l` 找檔、只看沒有私人值的行。
  動它的 repo 只有 08（照它自己的 `CLAUDE.md` 開 PR）；10 的實驗在另一份 clone。
- 公開 repo（這個）：commit、`.scratch`、PR 不帶真名、帳號名字、email、金鑰、VM host／GCP 專案 id／zone／instance 名。`~/.claude/mods-data/accounts.json`、客廳 `vm/devbox.json` 的值不要印出來、不要抄過來；
  比對私人值用 spawnSync 讀檔、只印筆數，不要把值放進指令字串（錯誤訊息會把值印進對話）。
- 這個環境的 Bash：heredoc 會把 `\\` 變成 `\`；`$(…)` 裡有 `$'…'` 會報錯但前半已經跑了；Git Bash 的 `awk` 把 CRLF 變 LF。要寫反斜線或改 CRLF 的檔用 Write／Edit 或 python 讀寫 bytes。
- guard 會把指令字串裡的 firebase CLI、firestore 網址、`neverWrite` 的 `git push`／`gh`／`gcloud` 當成指令，heredoc 內文也算（02 修好之前）：被跳框照實說明，不要改寫法繞；
  要在指令裡寫這類測試字串之前，先跟使用者說「等一下會跳框，是測試字串」；改測試檔用 Write／Edit 可以避開。
- 推到私人 repo、改 `settings.json`、改 skill 被 auto mode 擋下：**停**，寫進下面，請使用者做或交給主控，不要繞。
- 中途發現的事不岔出去修，記進下面「中途發現」（哪裡、什麼情境會錯、建議）；使用者說要修的，修之前再 grep 一次牽連。
- 改一個函式、一段文件或畫面上的字之前，grep／graphify 找出所有用到它的地方。
- subagent 同時最多兩個。
- 段自己不開 session、不存 limit-guard 的開場 JSON：主控照這份的開場開下一段。要主控決定的用 SendMessage 問主控（id 在最上面）；要使用者本人做的在段的對話裡直接請使用者做。
- 畫面有改的（儀表板）：電腦操作不能控制 Claude 自己的視窗。改完停下來回報「要截圖看哪幾頁」，主控請使用者在新對話點、截圖。
- 一段做完：更新這份（分段表狀態、中途發現、要使用者決定的）、寫好下一段的開場（照段 1 的開場的格式），然後結束。最後回覆用繁體中文簡短說做了什麼、卡在哪。

## 過目抓到的

唯讀的 subagent（Plan）對著程式碼過目 12 支 issue；主控自己對了最重的幾條（guard `classify.ts:236-252` 的 firebase regex 與 `EMULATOR.test(cmd)`、上一個專案 `.local/tools/` 檔案清單與 `.local/README.md:79,101`、客廳 `autosync.mjs` 的 `syncProject` 與最後的 `process.exit(0)`），都成立。改了：

| # | 抓到的 | 改成 |
|---|---|---|
| 01 | 現在就有的少問洞：`npx -y firebase-tools@latest deploy`／`firestore:delete --project baobu-app` 完全認不出（regex 要 `firebase\s+`）、`firebase.cmd`、`gcloud --project=… firestore import`（全域旗標在前）；`neverWrite` 的 `database`／`why` 不是字串、`null`、空字串也是壞法 | 01 改成「補現在就有的少問洞」，全部列進判準；框上的字寫出是 `neverWrite` 壞掉；`docs/project-config.md:29` 補例外 |
| 02 | 黑名單一定會漏（`&`、`\| bash`、雙引號裡的 `$(…)`、不加引號 heredoc 的展開、`node -e "…execSync(…)"`、`gcloud compute ssh --command`、`pwsh -enc`…十幾種）；「引號裡的字不算」會讓 `curl "https://firestore…"` 寫入漏掉；環境看整串（`demo-` 出現在 commit 訊息就當模擬器）是少問洞；`node -e` 那段不切段、不能當範本；判準 1、2 有幾條在這個 repo 的規則下現在其實不問 | 02 改成白名單（只拿掉確定不會執行的指令的引號參數、帶引號 heredoc 餵給 `cat` 等）、引號仍是這一段的參數、環境只看同一段、PowerShell 照舊掃整串、範圍列清楚（`deletes` 程式內文那條不套）；判準重寫，每條寫明規則與指令，「照舊要問」的是守住的綠燈測試 |
| 03 | 推不上去不是唯一沒推成的：拿不到鎖、commit 出錯、mirror 出錯也被吞；只帶新旗標會跑到背景；VM 那一半 `vmState` 叫的是 VM 上可能還沒更新的客廳 | 嚴格模式涵蓋全部、強制前景；只拿掉家裡與 presync 兩份，`vmState` 不動 |
| 04 | `--autostash` 套回衝突時 exit 0，接著 `--restore` 的 mirror 會刪掉剛寫的記憶；`pullLocal` 沒拿鎖 | 回家的家裡那一半改叫 03 的嚴格模式（在鎖裡），成功才 `--restore` |
| 05 | J2：`vm/` 底下沒有 unit 用 `--no-home`，真正的新舊混用在 `devbox.mjs:193`（家裡新版對 VM 舊版）；J5 「加一條測試」不能跨 node 與 mod，且 `worktreeOf` 在相對 gitdir 會算錯；06 要用 `mainDir` 但 autosync 一 import 就 `process.exit`；J8 會改既有測試檔、`test-helpers.mjs` 會被 `node --test` 當成測試 | J2 這一輪兩個名字一起帶；J5 共用案例 JSON、修 `worktreeOf`；J3 讓 autosync 可以被 import、export `mainDir`；J8 改名 `helpers-for-tests.mjs`；spec「允許改的既有測試」列了 import／setup 行 |
| 07 | 「客廳 0 筆」會被 `vm/devbox-rc-project:18`（註解）、`vm/existing/devbox-rc:11`（手機上看到的 Remote Control 名字）擋住；J4 也不能跨兩個 mod，兩邊輸出形狀不同 | 判準限定 dash 與 `tools/`；`devbox-rc-project` 註解順手拿掉、`existing/devbox-rc` 留給 12 問使用者；J4 兩個 mod 各一條測試＋同一份假資料 |
| 08 | `sync-skills` 是手動的、鏡像會刪檔（`domain-modeling` 的 `CONTEXT-FORMAT.md`，上一個專案用 `CONTEXT.md`）、會多出 `docs/licenses/`；`legacy-parity` 的 `OLD_JSON` 不再是複本 | 報告一定要寫這幾點；「客廳更新會跟著更新」改成說清楚是手動跑＋PR；`OLD_JSON` 不改測試、記中途發現 |
| 09 | **`.local/tools/pre-push` 是那個私人 repo 的推送關卡**（推之前查 PRIVATE），整個 `tools/` 刪掉新電腦就裝不到；客廳 `README.md:39` 也要改 | 逐檔列要刪的，`pre-push` 留著；`devbox-presync` 的檔交給 12 |
| 10 | port 寫死在 8～10 個檔（不是三處）、一組模擬器是五種加 Hub／logging／UI／websocket；clone 要從 GitHub 網址；40 分鐘高負載跟「不要長時間滿載」衝突 | 列出實際的檔、對照組也避開 port、push url 設無效值；先跑那 10 支紅過的、每次跑前使用者點頭；同步回這個 repo 要小心 `project.json`（guard 即時讀） |
| 11 | 格式跟 `lessons.md` 不同；「heredoc 把 `\\` 變 `\`」可能不是真正原因 | 照 lessons.md 格式、原因先確認；放到最後一段（收得到這一輪的坑） |
| 12 | 第 4 步「unit 換名字」不需要；VM 開機的 autosync 會跟出門的 `pull --rebase` 撞鎖；journal 可能沒持久化；出門要這個 repo 乾淨 | 都寫進步驟；`devbox-presync` 收掉的清單寫全 |

## 段 1 的開場

```
這一輪在做「工具收尾」：第 3 階段留下的清單全部做完，加上 E2E 加速的 skill。分支 claude/tooling-leftovers（已經在這個 checkout 上），還沒有任何實作 commit。
這是第 1 段：只做 issue 01 → 02（guard）。03 以後不做。

先讀：.scratch/tooling-leftovers/HANDOFF.md 的「每一段共同的規矩」「過目抓到的」；spec.md（「不能違反」guard 那一條）；issues/01、02；
.scratch/legacy-to-home/HANDOFF.md「中途發現」段 1 第 1 條、段 8 第 2、4、5 條、「段 7 審查結果」第 7 條；CLAUDE.md；docs/agents/lessons.md。

要特別注意：
- 01 只會多問：補現在就有的少問洞（`neverWrite` 欄位壞掉、`npx firebase-tools`、`firebase.cmd`、`gcloud` 全域旗標在前），每一條先紅燈。
- 02 是這一輪唯一「少問」的改動，用白名單（issue 02「做法」）：只拿掉確定不會執行的字；判準 3 的每一種「真的會執行」寫法都要有守住的測試（現在問、改完還問）。
  判準 3 清單以外，你想到會被執行的寫法也加進測試；拿不準算不算「會執行」的，當成會執行（照舊掃），記進中途發現。環境只看同一段（判準 2 是少問洞，先紅）。
- 01、02 改完在 spec「行為會變的」逐條列出多問／不再問的寫法。
- 寫含 firebase／firestore 網址／git push 國王日記 repo 的測試字串前，先跟使用者說「等一下會跳框，是測試字串」；測試檔用 Write／Edit 寫可以避開。
- 測試一支一支跑：guard（38＋新的）、最後 limit-guard 52 也跑一次（共用 project.json 讀法的話）。

做完要交：01、02 各一個 commit（這個 repo；客廳 mods 照規矩）、Status: done、「做完時留下的」、HANDOFF 分段表段 1 ✅、中途發現、段 2 的開場（03 → 04，xhigh；照段 1 的開場的格式）。
額度快用完時：每做完一支就 commit、推、記進 HANDOFF，停在支與支之間。
最後回覆用繁體中文簡短說做了什麼、卡在哪。
```

## 中途發現

（段寫：`### 段 N`，表格「# | 哪裡 | 什麼情境會錯 | 建議」）

## 要使用者決定的

（段寫；一次一題、附建議）

## 要使用者做的

## 使用者已經決定的（2026-10-29，主控 session）

- 「下一輪，候選清單就一起做吧，全部完成」
- 第 1 題 VM：「開一次（建議）」
- 第 2 題 E2E：「照建議」（客廳通用 skill＋另一份 clone 的實驗分支試 2 個 worker 各一顆模擬器，不推、不開 PR）
- 上一輪的：GitHub Support 不送；`.local/tools/` 與 `claude-mods/` 這一輪刪；上一個專案的 skill 看過差異再換

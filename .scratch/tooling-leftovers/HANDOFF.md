# 工具收尾 HANDOFF

分支 `claude/tooling-leftovers`（從 `claude/legacy-to-home` 的 `1de96ba` 開）。spec：`spec.md`。主控：`local_b2ec433b-f899-4bc0-9984-418dfa4247d4`（段 3b 續的時候換了；更早的是 `local_cc2e38d3-…`、`local_fba130a7-…`。主控自己的筆記在 `.local/main-session-handoff.md`）。

## 分段

| 段 | issue | effort | 狀態 |
|---|---|---|---|
| 1 guard | 01 → 02 | xhigh（02 是這一輪唯一「少問」的改動，白名單與守住的測試很多） | ✅ 01（客廳 `d3bc4a0`）、02（客廳 `3950996`，段 1 續）；guard 38 → 56 |
| 2 同步的兩個 git 行為 | 03 → 04 | xhigh（兩台同時寫 git 的紅燈測試） | ✅ 03（客廳 `b5631ea`）、04（客廳 `0ef32ab`）；autosync 19 → 31、devbox-mods 22 → 29 |
| 3 tools 整理 | 05 → 06 | high | ✅ 05（客廳 `baebee3`）、06（客廳 `52da7a7`）；autosync 31 → 33、devbox 14 → 17、devbox-mods 29 → 30、limit-guard 52 → 58 |
| 3b guard 刪東西 | 13（使用者 10/29 加的） | high（「少問」的改動，守住的測試多） | ✅ 13（客廳 `fbf35e9`，段 3b；量測與收尾段 3b 續）；guard 56 → 64 |
| 4 儀表板 | 07 | high（要截圖） | ✅ 07（客廳 `3d925e7`；10/29 截圖過了）；dash 38 → 56、limit-guard 58 → 67、客廳 `tools/shared-fixtures.test.mjs` 1 |
| 5 E2E | 10 | high（每次跑之前使用者點頭） | ✅ 10（客廳 `e977e8b`、`2a0c53a`）：skill `e2e-speed`；實驗 10 個檔 1 個 worker 6.3 分 → 2 個 worker 各一組 3.5 分、0 紅（中間一次斷網紅 8，重跑全過）→ 3 個 worker 各一組 3.0 分、0 紅、CPU 平均 40%／最高 77% |
| 6 上一個專案 | 09 → 08 | high（08 中途要問使用者） | ⬜ |
| 7 VM | 段 2 中途發現 1 → 12 | high（開 VM、花錢，主控開段前再提醒使用者） | ⬜ |
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
  mods `claude plugin test <mod>`：guard 56（段 1 之後）、limit-guard 52、dash 38、e2e-progress 5、notify 6；
  客廳寫檔名：`node --test tools/autosync.test.mjs` 19（段 2 之後 31）、`tools/mods.test.mjs` 13、`tools/devbox.test.mjs` 14、`tools/devbox-mods.test.mjs` 22（段 2 之後 29，約 3 分鐘）（**不要** `node --test tools/`）。
- **上一個專案**（`C:/Users/DELL/Desktop/baobao-wellness-clinic-scheduler`）：它的資料夾、分支、worktree、正在用的設定都不動；`.local/references/` 不讀；記憶用 `grep -l` 找檔、只看沒有私人值的行。
  動它的 repo 只有 08（照它自己的 `CLAUDE.md` 開 PR）；10 的實驗在另一份 clone。
- 公開 repo（這個）：commit、`.scratch`、PR 不帶真名、帳號名字、email、金鑰、VM host／GCP 專案 id／zone／instance 名。`~/.claude/mods-data/accounts.json`、客廳 `vm/devbox.json` 的值不要印出來、不要抄過來；
  比對私人值用 spawnSync 讀檔、只印筆數，不要把值放進指令字串（錯誤訊息會把值印進對話）。
- 這個環境的 Bash：heredoc 會把 `\\` 變成 `\`；`$(…)` 裡有 `$'…'` 會報錯但前半已經跑了；Git Bash 的 `awk` 把 CRLF 變 LF。要寫反斜線或改 CRLF 的檔用 Write／Edit 或 python 讀寫 bytes。
- guard（02 之後，客廳 `3950996`）：`echo`、`grep`、`git commit -m`、`gh pr create --body` 的引號參數、餵給 `cat`／`tee`／`git commit -F -` 的帶引號 heredoc（`<<'EOF'`）裡的字不再當成指令；
  `python - <<'EOF'`、`node -e`、`bash -c`、不帶引號的 heredoc、`| bash`、寫檔之後同一串又跑別的程式（`cat > x <<'EOF' … && node …`）照舊掃。在這些裡寫 firebase CLI、firestore 網址、`git push` 國王日記 repo 的測試字串之前，
  先跟使用者說「等一下會跳框，是測試字串」；改測試檔用 Write／Edit 可以避開。被跳框照實說明，不要改寫法繞。
  改筆記、issue、spec、HANDOFF 一律用 Edit／Write，不要用 `python - <<'EOF'`、`node -e` 改：guard 會把程式裡寫到的 `rm`、firebase 這類字當成指令掃，跳「看不出要刪什麼」的框（段 3b 續改 issue 13 時跳了一次，框上同一句重複 6 行）。
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

## 段 1 續的開場

```
這一輪在做「工具收尾」：第 3 階段留下的清單全部做完，加上 E2E 加速的 skill。分支 claude/tooling-leftovers（已經在這個 checkout 上）。
這是第 1 段續：01 做完了（客廳 d3bc4a0；這個 repo 609c6d5 起），這一段只做 issue 02（guard 白名單）。03 以後不做。

先讀：.scratch/tooling-leftovers/HANDOFF.md 的「每一段共同的規矩」「過目抓到的」「中途發現」段 1；spec.md（「不能違反」guard 那一條、「行為會變的」01）；issues/01 的「做完時留下的」、issues/02；
.scratch/legacy-to-home/HANDOFF.md「中途發現」段 1 第 1 條、段 8 第 2、5 條；CLAUDE.md；docs/agents/lessons.md。

01 留下、02 要接著用的：
- 客廳 classify.ts 新的 FIREBASE_CLI（套件執行器＋firebase-tools、firebase.cmd、全域旗標在前）；第 2 組是子指令後面的字，firebase use 的目標從那裡讀。gcloud firestore 的 regex 也認全域旗標在前。
- Rules.broken 是 true | 'neverWrite'；badConfig(seg, rules)。
- legacy-parity 的兩條「逐條一樣」比的是整個 Verdict（含 why 裡的 seg 文字）：切段之後 CASES 的每一條 seg 字串要跟以前一字不差（why 是 seg.trim().slice(0,160)）。
- ~/.claude/mods 是即時生效的：改到一半的 classify.ts 會馬上管這個對話的指令。改壞了 guard 會擋下（「檢查這一行指令時出錯了」）——先用 Edit 改回能跑的版本。
- 換行：客廳 guard 只有 tests/guard.test.ts 是 CRLF，其他（classify.ts、新測試）是 LF。查換行用 python 數 bytes，不要用 grep -c $'\r'（中途發現段 1 第 1 條）。

要特別注意：
- 02 是這一輪唯一「少問」的改動，用白名單（issue 02「做法」）：只拿掉確定不會執行的字；判準 3 的每一種「真的會執行」寫法都要有守住的測試（現在問、改完還問）。
  判準 3 清單以外，你想到會被執行的寫法也加進測試；拿不準算不算「會執行」的，當成會執行（照舊掃），記進中途發現。環境只看同一段（判準 2 是少問洞，先紅）。
- 02 改完在 spec「行為會變的」逐條列出不再問的寫法（01 的已經列好）。
- 寫含 firebase／firestore 網址／git push 國王日記 repo 的測試字串前，先跟使用者說「等一下會跳框，是測試字串」；測試檔、筆記用 Write／Edit 寫可以避開（段 1 用 bash heredoc 寫 issue 筆記，guard 把裡面的字記成碰了 Firebase）。
- 測試一支一支跑：guard（49＋新的）、最後 limit-guard 52 也跑一次。

做完要交：02 一個 commit（這個 repo；客廳 mods 照規矩）、Status: done、「做完時留下的」、HANDOFF 分段表段 1 ✅、中途發現、段 2 的開場（03 → 04，xhigh；照段 1 的開場的格式）。
額度快用完時：停在可以交接的地方，commit、推、記進 HANDOFF。
最後回覆用繁體中文簡短說做了什麼、卡在哪。建議 effort：xhigh。
```

## 段 2 的開場

```
這一輪在做「工具收尾」：第 3 階段留下的清單全部做完，加上 E2E 加速的 skill。分支 claude/tooling-leftovers（已經在這個 checkout 上）。
這是第 2 段：只做 issue 03 → 04（客廳的同步：autosync 嚴格模式、devbox 回家的家裡那一半）。05 以後不做。段 1（01、02 guard）做完了（客廳 d3bc4a0、3950996）。

先讀：.scratch/tooling-leftovers/HANDOFF.md 的「每一段共同的規矩」「過目抓到的」03、04、「中途發現」段 1；spec.md（「不能違反」「允許改的既有測試」）；issues/03、04；
.scratch/legacy-to-home/HANDOFF.md「判斷題」J1、「中途發現」段 5 第 1 條、段 9 第 1 條；CLAUDE.md；docs/agents/lessons.md。

要特別注意：
- 03：autosync 加嚴格模式（旗標名段裡定），一定在前景跑；推被拒／推失敗、拿不到鎖（比照 --restore-mods 等約 30 秒）、git add／commit 出錯、memoryDir／mirror 出錯都 exit 1，訊息說是哪個專案哪一步。
  mods 那一半不在範圍。不帶這個模式照舊 exit 0、只寫 log（對話開始／結束的 hook 不受影響）。
  devbox 只拿掉家裡（pushLocal）與 presync 兩份「推完了沒」，改看 exit code；VM 那一半的 vmState／checkVmState 不動（回家時 VM 上可能是舊版客廳，新旗標會被忽略）。
- 04：回家的家裡那一半直接叫 03 的嚴格模式（在鎖裡 commit → pull --rebase → 推；接不起來就 abort、exit 1），成功才 --restore。不另寫 rebase、不用 --autostash（套回衝突時 exit 0，接著 --restore 的 mirror 會刪掉剛寫的記憶）。
- 紅燈先：暫存 bare repo＋兩個 clone 做「兩台同時寫 git」，不碰真的 .local。推被拒、拿不到鎖、commit 出錯、兩邊改同一個檔、沒 commit 的檔＋遠端改同一個檔，各一條先紅。
- 對話開始／結束的 hook 直接跑 C:/Users/DELL/claude-home/tools/autosync.mjs：改到一半的檔會被真的同步叫到（其他對話也是）。先在暫存的複本改、測過再放回客廳（段 1 改 guard 也是這樣做）。
- autosync 一 import 就跑、最後 process.exit（05 J3 才改）：測試照既有的寫法用子程序跑，不要 import。
- 既有測試一條都不改：autosync 19、devbox 14、devbox-mods 22、mods 13（客廳寫檔名 node --test tools/<檔名>，不要 node --test tools/）；要改的先停、用 SendMessage 問主控。
- 不要按出門／回家、不要開 VM（12 才開）。

做完要交：03、04 各一個 commit（這個 repo；客廳照規矩）、Status: done、「做完時留下的」、HANDOFF 分段表段 2 ✅、中途發現、段 3 的開場（05 → 06，high；照段 1 的開場的格式）。
額度快用完時：每做完一支就 commit、推、記進 HANDOFF，停在支與支之間。
最後回覆用繁體中文簡短說做了什麼、卡在哪。建議 effort：xhigh。
```

## 段 3 的開場

```
這一輪在做「工具收尾」：第 3 階段留下的清單全部做完，加上 E2E 加速的 skill。分支 claude/tooling-leftovers（已經在這個 checkout 上）。
這是第 3 段：只做 issue 05 → 06（客廳 tools 異味整理、devbox --project 是 worktree 時看主資料夾）。07 以後不做。段 1（01、02 guard）、段 2（03、04 同步）做完了（客廳 d3bc4a0、3950996、b5631ea、0ef32ab）。

先讀：.scratch/tooling-leftovers/HANDOFF.md 的「每一段共同的規矩」「過目抓到的」05、06、「中途發現」段 1、段 2；spec.md（「不能違反」「允許改的既有測試」「行為會變的」03、04）；issues/03、04 的「做完時留下的」、issues/05、06；
.scratch/legacy-to-home/HANDOFF.md「判斷題」J2、J3、J5、J6、J8、「中途發現」段 4 第 1 條；CLAUDE.md；docs/agents/lessons.md。

03、04 留下、05 要接著用的：
- autosync 多了 --strict（嚴格模式）：模式旗標現在是 --dry-run、--restore、--restore-mods、--check-mods、--strict 五個（autosync.mjs:37-41）＋ --now、--worker、--mods、--no-home。J3 開頭算一次 mode 時 --strict 也要算進去：一定在前景、只管專案那一半、最後 process.exit(code)（不是 0）。
- 共用常數 LOCK_WAIT（:46，--strict 與 --restore-mods 等鎖；測試用 AUTOSYNC_LOCK_WAIT_MS 換短）；新的 step(what, fn)；errText 取 git 的 fatal:／error: 那行。
- --no-home 的呼叫端多了：devbox.mjs:154（pushLocal）、:161（pullLocal）、:421（presync），都是 --strict --no-home；:190（vmState，經 ssh 在 VM 上的客廳跑）照舊 --now --no-home。客廳 README 的手動用法那行也有。段 2 新寫的 autosync 測試 strict() 也帶 --no-home（兩個名字都認就不用改）。
- 測試基準：autosync 31、devbox 14、devbox-mods 29（約 3 分鐘）、mods 13、limit-guard 52。段 2 新加的測試在 autosync.test.mjs、devbox-mods.test.mjs 檔尾，各自定義了 releaseLater、midRebase（兩支各一份）、hook（autosync）：J8 抽 helpers-for-tests.mjs 時可以一起收，但只能改 import／setup 行、斷言不改（spec「允許改的既有測試」）。
- 「讓 autosync 可以被 import」之後，嚴格模式的 exit code（失敗 1）、背景模式（hook 不帶旗標時馬上 exit 0）都要照舊：autosync 31 條守著。

要特別注意：
- 對話開始／結束的 hook 直接跑 C:/Users/DELL/claude-home/tools/autosync.mjs：改到一半的檔會被真的同步叫到（其他對話也是）。照段 2 的做法：把客廳 tools/ 複製到 scratchpad、在複本改、測過、cmp 一樣再放回客廳。
- J2 改名 --no-mods：新的 autosync 兩個名字都認；devbox.mjs:190（VM 上的客廳可能還沒 pull）這一輪同時帶 --no-home --no-mods。寫進 spec「行為會變的」。
- J5 改 limit-guard（~/.claude/mods 即時生效）：照 mods 規矩（tsc、validate、複製進客廳、逐檔相同）；相對 gitdir 的案例紅燈先。
- J3、J6、J8 不改行為：既有測試的斷言一條都不改。測試一支一支跑（客廳寫檔名，不要 node --test tools/）。
- 06 用 05 從 autosync export 的 mainDir，不另寫一份；紅燈先。
- 中途發現段 2 第 1 條（出門的 VM 那一半 --autostash 套回衝突 exit 0）不在 05、06 的範圍：照主控的決定，不要順手改。
- 不要按出門／回家、不要開 VM（12 才開）。

做完要交：05、06 各一個 commit（這個 repo；客廳照規矩）、Status: done、「做完時留下的」、HANDOFF 分段表段 3 ✅、中途發現、段 4 的開場（07，high；照段 1 的開場的格式）。
額度快用完時：每做完一支就 commit、推、記進 HANDOFF，停在支與支之間。
最後回覆用繁體中文簡短說做了什麼、卡在哪。建議 effort：high。
```

## 段 3b 的開場

```
這一輪在做「工具收尾」：第 3 階段留下的清單全部做完，加上 E2E 加速的 skill。分支 claude/tooling-leftovers（已經在這個 checkout 上）。
這是第 3b 段：只做 issue 13（guard：刪東西時救得回來的不問、框上說清楚刪什麼）。這支是使用者 10/29 這一輪中途加的。07 以後不做。段 1～3 做完了（guard 01、02 在客廳 d3bc4a0、3950996）。

先讀：.scratch/tooling-leftovers/HANDOFF.md 的「每一段共同的規矩」「中途發現」段 1；spec.md（「不能違反」guard 那一條、「行為會變的」01、02）；issues/02 的「做完時留下的」、issues/13；CLAUDE.md；docs/agents/lessons.md。

02 留下、13 要接著用的：
- classify.ts 有 Bash 切段器 parseShell、遮字 maskShell、readable（讀不懂照舊掃整串）；deletes 約 :243-269，TEMP 只看 rm 那一段（所以 `S=<scratchpad>; rm -rf $S/exp` 會問：使用者貼的框就是這個）。
- 「環境只看同一段＋同一層前面 export 的段」的寫法可以參考來代變數；變數代法不要另寫一套切段。
- legacy-parity 比整個 Verdict（含 why）：不要改既有的 why，新的白話說明另外放。CASES 有判斷變了的，先停、SendMessage 問主控。
- tests/fixtures/classify-d3bc4a0.ts 是 02 之前的 classify，不要動。

要特別注意：
- 這是「少問」的改動：判準 2 每一條「照舊要問」都要有守住的測試（現在問、改完還問）；拿不準救不救得回來的，當成救不回來（問），記進中途發現。
- hook 裡跑 git：要有時間上限，失敗或逾時就問；量最慢一次多久。
- ~/.claude/mods 即時生效：在 scratchpad 複本改、tsc 0 錯、validate 過、複製進客廳 mods/、兩份逐檔相同。改壞了 guard 會擋下這個對話的指令，先用 Edit 改回能跑的版本。
- 寫含 firebase／firestore 網址／git push 國王日記 repo 的測試字串前，先跟使用者說「等一下會跳框，是測試字串」；測試檔用 Write／Edit。
- 測試一支一支跑：guard（56＋新的）、最後 limit-guard 58 也跑一次。
- 框上的字會變：做完附 2～3 個「改之前／改之後」框上說明的例子在最後回覆裡（不用截圖：guard 的框是 hook 跳的，測試斷言就好）。

做完要交：13 一個 commit（這個 repo；客廳 mods 照規矩）、Status: done、「做完時留下的」、spec「行為會變的」13、HANDOFF 分段表段 3b ✅、中途發現。段 4 的開場已經寫好（下面），不用重寫；有要補的加在它的「主控補充」。
額度快用完時：停在可以交接的地方，commit、推、記進 HANDOFF。
最後回覆用繁體中文簡短說做了什麼、卡在哪。建議 effort：high。
```

## 段 3b 續的開場

```
這一輪在做「工具收尾」。分支 claude/tooling-leftovers（已經在這個 checkout 上）。這是第 3b 續段：把 issue 13（guard：刪東西時救得回來的不問、框上說清楚刪什麼）收尾。07 以後不做。
段 3b 停在 5 小時額度快滿：程式與測試做完、已經在用了（客廳 fbf35e9，~/.claude/mods/guard 與客廳 mods/ 逐檔相同；guard 56 → 64、tsc 0 錯、validate 過）；這個 repo 的 issue 13「做完時留下的」、spec「行為會變的」13 寫好了。

先讀：這份「每一段共同的規矩」「中途發現」段 3b；issues/13（「做完時留下的」）；spec「行為會變的」13；客廳 mods/guard/hooks/removals.ts、register.ts 的 gitFacts／goneOf。

要做的：
1. 判準 5：拿過去對話真的跑過的刪除指令量一次（跟 02 一樣：讀 ~/.claude/projects/ 底下這個專案與上一個專案的 transcript，只印筆數與遮過的形狀，不印路徑與私人值）：
   每條用改之前（classify 不傳 gone）與改之後（removals＋judge）比，少問幾條、多問幾條。git 那一半可以真的問（唯讀），但路徑要在當時的資料夾算——算不出來的（cwd 不同、檔案已經不在）歸「找不到 → 問」，另外列筆數。結果寫進 issue 13「做完時留下的」、spec「行為會變的」13 最後一行。
2. limit-guard 58 跑一次（claude plugin test ~/.claude/mods/limit-guard）。guard 64 再跑一次。
3. issue 13 Status: done；HANDOFF 分段表段 3b ✅；commit 這個 repo（一支 issue 一個 commit：這一段的 issue 13、spec、HANDOFF 一起）、推。
4. 段 3b 留下要確認的：段 3b 刪探測資料夾（.scratch 底下沒追蹤的空資料夾）那兩下，照設計要跳框（「找不到…」）；段 3b 看不到框。問使用者那時有沒有跳框、框上寫什麼——沒跳就是 bug，先查 goneOf（`$.env.get`、`$.session.cwd()` 在真的 hook 裡的值）。
   → 主控 10/29 問了，**使用者：「有跳」**（框上的字沒說）＝照設計，不用查 goneOf。issue 13「做完時留下的」記一行即可。
注意：改 ~/.claude/mods 即時生效，照規矩在 scratchpad 複本改；寫含 firebase／firestore 網址的測試字串前先跟使用者說會跳框。
最後回覆用繁體中文簡短說做了什麼、卡在哪。建議 effort：medium。
```

## 段 4 的開場

```
這一輪在做「工具收尾」：第 3 階段留下的清單全部做完，加上 E2E 加速的 skill。分支 claude/tooling-leftovers（已經在這個 checkout 上）。
這是第 4 段：只做 issue 07（儀表板「雲端」分頁標題讀設定、J7、J4）。08 以後不做。段 1～3 做完了（客廳 d3bc4a0、3950996、b5631ea、0ef32ab、baebee3、52da7a7）。

先讀：.scratch/tooling-leftovers/HANDOFF.md 的「每一段共同的規矩」「過目抓到的」07、「中途發現」段 1～3；spec.md（「不能違反」「允許改的既有測試」「行為會變的」05、06）；issues/05、06 的「做完時留下的」、issues/07；
.scratch/legacy-to-home/HANDOFF.md「中途發現」段 6 第 1 條、「判斷題」J4、J7；CLAUDE.md；docs/agents/lessons.md。

05、06 留下、07 要接著用的：
- 兩個 mod（或 mod 與 tools）共用的資料：mod 測試引擎不載入 .json（「is not named like code and was not loaded」），用只有型別標註的 .ts 放在 mod 的 tests/fixtures/；Node 24 也能直接 import .ts，tools 的 node 測試寫 import … from '../mods/<mod>/tests/fixtures/x.ts'。
  範例：limit-guard tests/fixtures/worktree-cases.ts（05 J5，客廳 autosync.test.mjs 與 limit-guard worktree-handoff.test.ts 各讀一次）。J4 的「同一份假資料」照這個做法，就不用另寫「兩份假資料逐字相同」的比對。
- J7 順便看的 DashVm.project（在 worktree 開的對話寫 worktree 名）：要改成主資料夾名的話，認法照 limit-guard worktreeOf（05 修好了相對 gitdir）與 autosync mainDir，案例用 worktree-cases.ts，不要再寫第三份認法。devbox 那邊 06 已經改成看主資料夾。
- 測試基準：limit-guard 58（05 之後）、dash 38；客廳 autosync 33、devbox 17、devbox-mods 30（約 3.5 分鐘）、mods 13。tools/helpers-for-tests.mjs 有 gitWith(env)、write、read、midRebase、releaseLater、hook。

要特別注意：
- 「雲端」分頁標題寫死的 instance 名是私人值：dash 與 tools/ 還有幾筆用 spawnSync 讀 devbox.json 比、只印筆數，不要把值放進指令字串或印出來。vm/existing/devbox-rc:11 不改（寫進 12 讓那一段決定）。
- J4：兩個 mod 各一條測試＋同一份假資料，先定好投影成同一種形狀（limit-guard 回其他帳號、排除目前帳號與 switchable:false；dash 回全部）。
- 改 ~/.claude/mods 即時生效：在複本改、tsc 0 錯、validate 過、複製進客廳 mods/、兩份逐檔相同（段 3 的做法：scratchpad 複本 → 測過 → cp → cmp）。
- 畫面上的字會變：改完停下來回報「要截圖看哪一頁」（「雲端」分頁），主控請使用者在新對話點、截圖。截圖過了才算 done（Status 先寫「等截圖」）。
- 測試一支一支跑；寫含反斜線的檔用 Write／Edit（bash heredoc 會把 \\n 變成真的換行，段 3 又踩了一次）。

做完要交：07 一個 commit（這個 repo；客廳照規矩）、Status、「做完時留下的」、HANDOFF 分段表段 4、中途發現、要截圖的頁、段 5 的開場（10，high；照段 1 的開場的格式）。
額度快用完時：停在可以交接的地方，commit、推、記進 HANDOFF。
最後回覆用繁體中文簡短說做了什麼、卡在哪。建議 effort：high。
```

## 段 5 的開場

```
這一輪在做「工具收尾」：第 3 階段留下的清單全部做完，加上 E2E 加速的 skill。分支 claude/tooling-leftovers（已經在這個 checkout 上）。
這是第 5 段：只做 issue 10（E2E 加速的通用 skill＋「一個 worker 一顆模擬器」實驗）。08、09 以後不做。段 1～4 做完了（客廳 d3bc4a0、3950996、b5631ea、0ef32ab、baebee3、52da7a7、fbf35e9、3d925e7；07 等截圖，不擋這一段）。

先讀：.scratch/tooling-leftovers/HANDOFF.md 的「每一段共同的規矩」「過目抓到的」10、「中途發現」段 4；spec.md（「使用者要的」E2E 那幾句、「使用者選的答案」第 2 題、「不能違反」第 1 條）；issues/10（「動工前先讀」列的上一個專案的檔與記憶）；CLAUDE.md；docs/agents/lessons.md。

要特別注意：
- 上一個專案一律不能壞：它的資料夾、分支、worktree、它平常用的模擬器 port 都不動。實驗在另一份 clone（從 GitHub 網址 clone、push url 設無效值、實驗分支不推不開 PR）。
- 每次跑 E2E 之前，在這個對話跟使用者說大約多久、CPU 大約多少，**使用者點頭才跑**；一次只跑一組，跑完把模擬器與瀏覽器程序關乾淨。先只跑 09-09 那 10 支紅過的檔（1 個 worker 一次、2 個 worker 各一顆一次），值得再談全量。
- port 寫死的地方不只三處（issue 10「做法」列了）：用 emulatorPortsFor(worker) 當唯一推導；對照組也避開上一個專案平常的 port。
- skill：用 skill-creator，放客廳 skills/，名字不跟上一個專案的 test-speed 同名；沒量過的數字不寫進任何檔；觸發描述放軟。客廳 skills/README.md「來源與版本」加一列。
- 同步回這個 repo：.claude/project.json 的 skills 加名字——guard 即時讀這個檔，JSON 打錯整個 guard 每條都問，改完先 node -e 讀一次確認合法；再跑 sync-skills。改 skill 被 auto mode 擋下就停、照規矩交給主控。
- 讀上一個專案的記憶用 grep -l 找檔、只看沒有私人值的行；.local/references/ 不讀。
- 兩個 mod 要共用假資料時：mod 測試不能 import 自己資料夾外的檔（段 4 中途發現 1）；這一段應該用不到。

做完要交：10 一個 commit（這個 repo；客廳照規矩）、Status: done、「做完時留下的」（量到的數字與出處、clone 留著或刪了）、HANDOFF 分段表段 5、中途發現、段 6 的開場（09 → 08，high；照段 1 的開場的格式）。
額度快用完時：停在可以交接的地方（例如量完一組、skill 還沒寫），commit、推、記進 HANDOFF。
最後回覆用繁體中文簡短說做了什麼、卡在哪。建議 effort：high。
```

## 段 6 的開場

```
這一輪在做「工具收尾」：第 3 階段留下的清單全部做完，加上 E2E 加速的 skill。分支 claude/tooling-leftovers（已經在這個 checkout 上）。
這是第 6 段：只做 issue 09 → 08（上一個專案：刪 .local/tools/ 的舊工具與 .local/claude-mods/；skill 差異報告 → 使用者決定 → 換）。12 以後不做。段 1～5 做完了（客廳 d3bc4a0、3950996、b5631ea、0ef32ab、baebee3、52da7a7、fbf35e9、3d925e7、e977e8b）。

先讀：.scratch/tooling-leftovers/HANDOFF.md 的「每一段共同的規矩」「過目抓到的」08、09、「中途發現」段 5；spec.md（「使用者選的答案」、「不能違反」第 1 條）；issues/09、08、issues/10 的「做完時留下的」最後「skill」那一節；
.scratch/legacy-to-home/spec.md「使用者選的答案」第 2、7 題；.scratch/legacy-to-home/HANDOFF.md「段 7 審查結果」第 2 條；docs/env-notes.md（skill 同步）；客廳 docs/project-config.md；上一個專案的 CLAUDE.md（它的 PR 與合併規定）；CLAUDE.md；docs/agents/lessons.md。

10 留下、08 要接著用的：
- 客廳多了 skills/e2e-speed（通用版）。上一個專案的 .claude/skills/test-speed 是專案自己的（名字不同，sync-skills 不會動它）。差異報告裡這一支要寫清楚：e2e-speed 不是 test-speed 的新版，是拿掉專案細節的通用版＋「一個 worker 一組模擬器」的數字；
  上一個專案要不要也選 e2e-speed、test-speed 留不留，是使用者的決定（test-speed 裡有那個專案自己的檔名、數字與流程，e2e-speed 沒有）。
- sync-skills 會連 evals/、scripts/、references/ 整個資料夾一起帶（e2e-speed 帶了 10 個檔）。
- 實驗的 clone 在 C:/w/e2e-exp（留著；實驗 commit 只在本機）。08、09 不用它；別刪，主控還要問使用者全量／正式改的事。

要特別注意：
- 上一個專案一律不能壞：它的資料夾、分支、worktree 前後相同（段 5 開工時：claude/availability-sheet-chart-no、5b785ad8、worktree list 10 行）。動它的 repo 只照它自己的 CLAUDE.md 開 PR。
- 09：.local/tools/pre-push 留著（那個私人 repo 的推送關卡）；逐檔列要刪的；devbox-presync 的檔交給 12。刪之前照「先問再做」講清楚刪哪些、幾個、救不救得回來（有版控）。客廳 README.md:39 也要改。
- 08：先出差異報告、再問使用者一支一支換不換（一次一題、附建議）。換了之後客廳 legacy-parity.test.ts 的 OLD_JSON 不再逐字相同：不改測試，記中途發現。
- 上一個專案的 project.json 是 guard 即時讀的：改完先用 node 讀一次確認是合法 JSON。
- 讀上一個專案的記憶用 grep -l 找檔、只看沒有私人值的行；.local/references/ 不讀。

做完要交：09、08 各一個 commit（這個 repo；上一個專案照它的規定開 PR；客廳照規矩）、Status: done、「做完時留下的」、HANDOFF 分段表段 6、中途發現、段 7 的開場（段 2 中途發現 1 → 12，high；照段 1 的開場的格式）。
額度快用完時：每做完一支就 commit、推、記進 HANDOFF，停在支與支之間。
最後回覆用繁體中文簡短說做了什麼、卡在哪。建議 effort：high。
```

## 中途發現

（段寫：`### 段 N`，表格「# | 哪裡 | 什麼情境會錯 | 建議」）

### 段 5

進度：10 ✅（客廳 `e977e8b`）。照主控的話只記、不加進這一輪。

| # | 哪裡 | 什麼情境會錯 | 建議 |
|---|---|---|---|
| 1 | 過去對話的紀錄（`~/.claude/projects/<專案>/*.jsonl`） | 09-09 量 3 個 worker 的那個對話已經不在了（最早留下的是 10-05），所以「哪 10 個紅」只剩 issue 與 commit 點名的 4 個。issue 只寫了「形狀」沒寫檔名，這一段就重現不了「先跑那 10 個」 | 給 11（lessons）：量到的實驗結果，**原始清單**（檔名、測試名）要寫進 issue，不要只寫歸納；對話紀錄會被清掉 |
| 2 | 這台電腦沒有全域的 git `user.name`／`user.email` | 新 clone 的資料夾 commit 會失敗（`Author identity unknown`）。段 5 在 clone 裡只設了那個資料夾的 | 不急；要的話之後新 clone 照這個 repo 設定，或設全域 |
| 3 | 上一個專案的模擬器 Functions | 手動起一組完整模擬器時看過一次「Failed to load function definition … Timeout after 10000」（剛 `npm ci` 完第一次起）；之後兩次正式跑都正常載入。沒重現 | 不用修；再看到就記 |
| 4 | 上一個專案 E2E 載入字型與 Firebase SDK 都靠 gstatic CDN | 實測：跑到一半斷網／DNS 失敗，之後每個測試各燒 30 秒逾時、整批紅（B 第 1 次 8 個），看起來像平行壞掉。上一個專案記憶第 11 條的「C（SDK／字型在測試裡快取）還沒做」就是這件 | 不在這一輪；上一個專案要開平行或全量時，先做 C（記憶已記著） |

### 段 4

進度：07 ✅（客廳 `3d925e7`；10/29 截圖過了）。照主控的話只記、不加進這一輪。

| # | 哪裡 | 什麼情境會錯 | 建議 |
|---|---|---|---|
| 1 | 段 3 的開場寫「J4 的同一份假資料照 worktree-cases.ts 的做法，就不用另寫逐字相同的比對」 | **不成立**（段 4 實測）：mod 的測試不能 import 自己資料夾外的檔（`cannot import … it is outside the plugin's folder`），只有 tools 的 node 測試能 import mod 裡的 `.ts`。兩個 mod 要共用就得各放一份＋tools 測試比逐字相同（07 就這樣做） | 以後兩個 mod 共用假資料照 07：各一份＋`tools/shared-fixtures.test.mjs` 加一條。給 11（lessons）參考 |
| 2 | dash `vmView` 畫「這個月到現在」：`vm.usage.month.slice(5)` | `devbox.mjs usage` exit 0 但最後一行是沒有 `month` 的 JSON 時，整個儀表板面板畫不出來（引擎：「dash's ui.render hook was skipped」）。段 4 寫測試時假資料給錯重現過；**現在的 devbox.mjs 一定印 `month`**，不是會發生的錯 | 不急；哪天動 `vmUsage` 時順手檢查 `month` 是字串才存 |
| 3 | （主控 10/29 記的）guard 刪東西的框：客廳 `mods/guard/hooks/removals.ts:189` 一帶 | python／node heredoc 裡寫到 `rm` 字樣時，每一處都推一行「看不出要刪什麼」，框上是好幾行一模一樣的字，看不出是哪裡、為什麼（段 3b 續改 issue 13 時 6 行）。不會壞東西，只記 | 下一輪：同樣的理由合併成一行，寫出是在哪個程式裡（例如「python 程式裡寫到 rm，看不出要刪什麼」） |

### 段 3b

進度：13 ✅（客廳 `fbf35e9`；段 3b 續量了判準 5、跑了 limit-guard 58 與 guard 64）。照主控的話只記、不加進這一輪。

| # | 哪裡 | 什麼情境會錯 | 建議 |
|---|---|---|---|
| 1 | guard `removeVerbs` 的 rm regex `(?:^\|[\s;&\|(`])(?:rm\|…)\s+` | **重現過**（測試裡用改之前的 classify）：`bash -c "rm -rf notes"`（rm 緊接在引號後）、`echo a \| xargs rm`（rm 後面沒東西）改之前、改之後都**不問**。前面要是空白或分隔字、後面要有空白 | 下一輪：前面也認 `"`、`'`，後面認結尾；都是多問 |
| 2 | 13 的 cd 判斷 | `cd x; rm y`、PowerShell 的 `cd x; Remove-Item y` 一律問（cd 失敗會刪到原本的資料夾）。不是錯，多問一點 | 不用修。段 3b 續量過：上一個專案多問 14 條裡 11 條是這種（這個專案 1 條） |
| 3 | 13 的變數 `tainted`（段 3b 續量測時看到） | `$TEMP` 這種環境變數，前面有某些指令（例如 `X=$(node …)`、子 shell）就當成「可能被改了」→ 看不出 → 問。上一個專案量到 2 條。不是錯，多問一點；沒查是哪個字觸發的 | 不用修；嫌吵再看 `MAYSET` |

### 段 3

進度：05 ✅（客廳 `baebee3`、這個 repo `327a1b5`）、06 ✅（客廳 `52da7a7`）。段 2 第 2 條照主控的決定在 05 修了；第 1 條沒動。

沒有新的會錯的地方。整理時看到、沒動的（不是錯，記著）：`autosync.test.mjs`、`devbox.test.mjs` 開頭各還有一份 `git`／`write`，兩支 devbox 測試各有一份找 bash 的 `BASH`（spec 只准 J8 動 mods 與 devbox-mods 兩支）；`--no-home` 下一輪拿掉（`devbox.mjs` 的 `vmState` 那行與 `autosync.mjs` 的 `backupMods`）。

### 段 2

進度：03 ✅（客廳 `b5631ea`、這個 repo `07ae890`）、04 ✅（客廳 `0ef32ab`）。照主控的話只記、不加進這一輪。

| # | 哪裡 | 什麼情境會錯 | 建議 |
|---|---|---|---|
| 1 | 客廳 `devbox.mjs:281`：「出門」VM 那一半 `git -C .local pull -q --rebase --autostash \|\| { abort; exit 3; }`，接著 `--restore` | **重現過**（git 2.55，暫存 repo）：沒 commit 的改動跟拉下來的改了同一個檔時，`--autostash` 套回衝突，**exit 0**、檔案裡留著衝突記號（`<<<<<<< Updated upstream`）、stash 留著。`\|\|` 那段不會跑，接著 `--restore` 把衝突記號的檔鏡像進 VM 的記憶，印「✅ 可以出門了」；VM 下一次對話結束的同步 `git add -A` 會把衝突記號 commit、推上去。要 VM 的 `.local` 有沒 commit 的改動（presync 寫完檔、commit 前被殺掉；既有測試「VM 上 .local 有沒 commit 的 vm-state.json」承認這種狀態），而且家裡也改了同一個檔推上去（`vm-state.json` 只有 VM 寫，會撞的是 `claude-memory/`、`claude-handoffs/` 裡的檔），很少見 | 出門的 ③ 在專案迴圈之前已經把 VM 的客廳 `pull --ff-only` 了，所以 VM 那一半可以跟回家的家裡那一半一樣改叫 `node ~/claude-home/tools/autosync.mjs --project "$PWD" --strict --no-home`，exit 不是 0 就停、不跑 `--restore`。12 會真的走一次出門，主控看要不要排在 12 之前（多一支小 issue，紅燈：VM `.local` 沒 commit 的檔＋家裡推了同一個檔）→ 使用者：段 7 開頭修 |
| 2 | 客廳 `devbox.mjs` `pullLocal` 的 `--restore` 用 `sh()` 跑 | `--restore` 失敗時原因印在 stdout（「接回來的時候出錯了：…」），`sh()` 丟的錯只帶 stderr，最外層印成「出錯了：Command failed: <node 路徑> <autosync 路徑> --project … --restore」，看不到原因（Node 的 `execFileSync` 錯誤訊息不含 stdout）。少見（`mirror` 出錯才會），小 | 改用 `autosync('--project', p.home, '--restore')`＋`said(r)`（跟 pushLocal 一樣）。05 整理 devbox 時順手、或不修 |

### 段 1

進度：01 ✅（客廳 `d3bc4a0`、這個 repo `609c6d5`）；02 沒動：開 02 之前 5 小時額度 93%（18:50 重置），停在支與支之間，開場在上面「段 1 續的開場」。
段 1 續：02 ✅（客廳 `3950996`）。第 3～7 條是段 1 續找到的，照主控的話只記、不加進這一輪。

| # | 哪裡 | 什麼情境會錯 | 建議 |
|---|---|---|---|
| 1 | 這個環境的 Bash：`printf "%s" $(grep -c $'\r' $f)` | 印出來的是**行數**，不是 CR 的數（`$'\r'` 在 `$(…)` 裡沒變成 CR，`grep -c` 什麼都比對得到）。段 1 因此以為 guard 的檔全是 CRLF，把 `classify.ts` 換成 CRLF、整份變成改過，發現後換回 LF（commit 前，沒有進 repo）。實際上客廳 guard 只有 `tests/guard.test.ts` 是 CRLF，其他是 LF | 查換行用 python 讀 bytes 數 `\r\n`。給 11（lessons）：跟上一輪段 8 第 1、6 條同一類 |
| 2 | 01 判準「`gcloud --project baobu-app firestore export …`（要：照 `neverWrite` 擋）」 | `export` 本來就不在 guard 的 `gcloud firestore` 寫入清單（`import`、`delete`、`bulk-delete`、`create`、`update`、`restore`、`clone`）：它讀 database、寫到 GCS bucket，不寫國王日記的 database。段 1 做成跟寫在後面的同一種判斷（不問）。要「匯出國王日記也要問」就是把 `export` 加進清單（多問） | 不急；審查時主控看要不要問使用者 |
| 3 | 02 判準 3 的兩種「照舊要問」其實現在就不問 | `python - <<'EOF'`＋`subprocess.run(['firebase', 'deploy', '--project', 'baobu-app'])`（串列寫法：firebase 的 regex 要後面接空白）、`powershell -enc <base64>`（看不到字）：02 之前之後都不問。issue 02 以為會問。測試只守「改完跟改之前一樣」 | 下一輪：firebase 的 regex 也認 `'firebase', 'deploy'` 這種串列；`-enc`／`-EncodedCommand` 解 base64 再掃，或一律問。都是多問 |
| 4 | guard 不讀 bash 腳本的內容 | `bash x.sh`、`sh x.sh`、`./x.sh`、`source x.sh` 跑的腳本，guard 不讀內容（只讀 node／python 的）。02 之前用 heredoc 寫 `x.sh` 那一下會因為內文跳框（碰巧擋到）；02 之後同一串指令再跑它照舊掃（有測試），但「這一次寫、下一個 Bash 才跑」不會問——跟用 Write 寫檔再跑一樣，本來就有的洞 | 下一輪：`scriptPaths` 也認 `bash`／`sh`／`source`／`.`／`./x`，讀內容當成指令掃 |
| 5 | guard 把 `node --check x.mjs` 當成跑腳本 | `--check` 只檢查語法、不執行。02 之後別段寫到 staging id 不再讓它被當成 staging，上一個專案過去的指令裡有 2 條會多問一次（spec「行為會變的」02） | 小：`scriptPaths` 跳過 `--check`。不急 |
| 6 | 02 的切段器遇到 `case` 整串照舊掃 | `case … in a) …;; esac` 的 `pattern)` 會讓切段器以為 `$(…)` 結束（會把真的會執行的字遮掉），所以有 `case` 就當讀不懂。上一個專案過去的指令有 13 條，都是只讀的檢查，照舊掃沒有多問 | 不用修；記著 |
| 7 | `gcloud config set project baobu-app && gcloud firestore import gs://…` | 第二段沒寫 `--project`，`neverWrite` 認不出國王日記（02 之前之後都一樣；`export CLOUDSDK_CORE_PROJECT=…` 也是） | 下一輪：`gcloud firestore` 寫入沒寫 `--project` 時看同一串前面的 `gcloud config set project`，或沒寫就問（多問） |

## 要使用者決定的

（段寫；一次一題、附建議）

- ~~**段 5（10）：上一個專案要不要正式改成「一個 worker 一組模擬器」**~~ → 10/29 使用者「先不改（建議）」。實驗：10 個檔 1 個 worker 6.3 分 → 2 個 worker 3.5 分、0 紅（issue 10「做完時留下的」）。建議：**先不改**，下一輪先在 clone 量一次全量（09-09 全量 1 個 worker 是 23.9 分鐘，現在測試更多；分兩段跑、中間冷卻，跑前再點頭），並先做上一個專案記憶裡的 C（SDK／字型快取），斷網整批紅的問題沒解掉之前開平行不划算。正式改要照上一個專案的 `CLAUDE.md` 開 PR。
- ~~**段 5（10）：要不要跑 skill-creator 的對照評測**~~ → 10/29 使用者「這一輪不跑（建議）」。（有／沒有 `e2e-speed` 各跑兩個題目＝4 個 subagent，兩個一批；題目在 `skills/e2e-speed/evals/`）。建議：**這一輪不跑**；skill 是從量過的 test-speed 改寫，題目只驗「先量」「不寫沒量過的數字」兩件事，先用一陣子再看要不要評。

## 要使用者做的

- ~~**段 4（07）截圖「雲端」分頁**~~ → 10/29 截圖過了（主控看過三點都對）。原本的步驟：開一個新對話（這個專案；在 worktree 開的也可以，順便看第 3 點）→ 打開儀表板 → 點「雲端」分頁 → 截整頁。要看到：
  1. 第一張卡的標題是 VM 的名字（跟以前一樣；名字現在是從客廳 `vm/devbox.json` 讀的），不是「雲端 VM」；
  2. 狀態（開著／關著）、出門／回家／開機（或關機）按鈕、底下「這個月到現在」照常；
  3. 按鈕底下那行「在 baobuverse-kingdom 按的：…」——在 worktree 開的對話也要是 `baobuverse-kingdom`，不是 worktree 的名字。
  只截圖，**不要按出門／回家／開機**。截圖過了 07 改 done。

## 使用者已經決定的（2026-10-29，主控 session）

- 加 issue 13（guard 刪東西救得回來的不問、框上說清楚刪什麼），段 3 之後單獨一段：「好，照建議」。原話與範圍在 issues/13。
- 「下一輪，候選清單就一起做吧，全部完成」
- 第 1 題 VM：「開一次（建議）」
- 第 2 題 E2E：「照建議」（客廳通用 skill＋另一份 clone 的實驗分支試 2 個 worker 各一顆模擬器，不推、不開 PR）
- 上一輪的：GitHub Support 不送；`.local/tools/` 與 `claude-mods/` 這一輪刪；上一個專案的 skill 看過差異再換
- 段 2 中途發現第 1 條（出門 VM 那一半 `--autostash` 套回衝突 exit 0）：「段 7 開頭修（建議）」——開 VM 走出門之前，先把出門 VM 那一半改成跟回家一樣叫 `autosync --strict --no-home`，exit 不是 0 就停、不跑 `--restore`；紅燈先（VM `.local` 沒 commit 的檔＋家裡推了同一個檔）。（段 3 補：05 之後新名字是 `--no-mods`；出門的 ③ 先把 VM 的客廳 pull 了，VM 上已經是新版，用 `--no-mods` 就好）
- 段 5 實驗加量 3 組 3 個 worker：「試一次（建議）」（10 個檔 78 全過、3.0 分、CPU 平均 40%／最高 77%；客廳 `2a0c53a`）。
- 上一個專案正式改成「一個 worker 一組模擬器」：「先不改（建議）」——下一輪先在 clone 量全量、先解斷網整批紅（SDK／字型快取）；`C:/w/e2e-exp` 留給下一輪。
- skill-creator 對照評測：「這一輪不跑（建議）」，先用一陣子再看。

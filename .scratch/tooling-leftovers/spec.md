# 工具收尾：第 3 階段留下的清單＋E2E 加速

分支 `claude/tooling-leftovers`（從 `claude/legacy-to-home` 的 `1de96ba` 開：`main` 的 `91f5952`＋兩個只改 HANDOFF 的 commit，這一輪的 PR 一起帶進 `main`）。
上一輪的全貌在 `.scratch/legacy-to-home/`（spec、HANDOFF「下一輪要做的」「中途發現」「判斷題」）。這一輪的 issue 只寫要做什麼與判準，細節指回那裡。

## 使用者要的（原話）

2026-10-29，主控列出下一輪的候選清單之後：

> 下一輪，候選清單就一起做吧，全部完成

問 VM 的 5 項檢查清單（PR #6 內文）：

> 下次開 VM 時順便做 : 你沒幫我測試過嗎 ?

E2E 加速（第 3 階段開始前說的，主控交接記的原話）：

> 上個專案就是因為跑太久，如果是vm好像就可以多開幾個worker跑，或是都丟給github跑，本地只要跑必要的就好

> 上個專案不是也有寫優化e2的skill嗎 你可以幫我用skill-creator 幫我去更新那版e2e測試的，然後本基也可以開2 3 個worker跑沒關係，可以試試

主控說上一個專案量過「同一顆模擬器」3 個 worker 會紅之後：

> 所以就一定只能共用一顆 Firestore 模擬器 ?

上一輪就定下、這一輪照舊的原則：

> 不要影響到上個專案，畢竟那個專案還在進行中還在維護測試

## 使用者選的答案（2026-10-29，主控 session）

| # | 問題 | 答案 |
|---|---|---|
| 1 | 這一輪要不要開 VM 實測 | **開一次（建議）**：放在這一輪最後、同步那幾支改完之後；做 PR #6 的 5 項、真的走一次出門／回家，用完關機。開機前主控再提醒一次 |
| 2 | E2E 加速這一輪做到哪 | **照建議**：客廳寫通用版 skill（用 skill-creator，從上一個專案的 `test-speed` 改寫）；在上一個專案**另一份 clone 的實驗分支**試「2 個 worker、各一顆模擬器」，跟 1 個 worker 比時間與紅幾支。實驗分支不推、不開 PR，它的資料夾與分支都不動；數字寫進 skill，好的話再問要不要正式改 |
| — | 上一個專案的 skill 換成客廳的版本（上一輪 spec 第 2 題） | 上一輪答「這一輪不換，下一輪看過差異再換」→ 這一輪**先出差異報告、再問使用者**一支一支換不換（issue 08） |
| — | 刪上一個專案 `.local/tools/` 的舊工具、`.local/claude-mods/`（上一輪 spec 第 7 題） | 上一輪答「下一輪」→ 這一輪刪（有版控，救得回來） |
| 09 | 刪那 59 個檔（`pre-push` 與沒追蹤的舊 log 留著）（段 6，10/29） | **照建議刪** |
| 08-1 | kickoff 以外照差異報告（`08-skill-diff-report.md`）的建議：換 `grill-with-docs`、`grilling`、`matt-code-review`、`graphify`、`claude-md`；`domain-modeling`、`setup-matt-pocock-skills` 留舊版（`CONTEXT.md`）；`test-speed` 留著、不加 `e2e-speed`（段 6，10/29） | **照建議** |
| 08-2 | 上一個專案的 `kickoff` 換成客廳的通用版嗎（段 6，10/29） | **換＋補 CLAUDE.md**：舊 kickoff 裡的合併規定（CI 綠了合進 `develop`、合完 staging 自動部署、Function 照 `docs/STAGING.md`、進 `main` 要另外說）搬進它的 `CLAUDE.md`，同一個 PR |

## 範圍

| 塊 | issue | 來源（`.scratch/legacy-to-home/HANDOFF.md`） |
|---|---|---|
| guard | 01 補現在就有的少問洞（`neverWrite` 欄位壞掉、`npx firebase-tools`、`gcloud` 全域旗標在前）；02 確定不會執行的字串不當成指令（白名單） | 段 8 中途發現 4、過目；段 1 中途發現 1、段 8 中途發現 2、5 |
| 客廳同步／出門回家 | 03 推不上就 exit 1（J1）；04 回家的家裡那一半 `pull --rebase`；05 異味整理（J2、J3、J5、J6、J8）；06 `checkProjectArg` 看主資料夾 | 判斷題 J1～J8、段 9 中途發現 1、段 4 中途發現 1 |
| 儀表板 | 07 「雲端」分頁標題讀設定（截圖）、J7、J4 | 段 6 中途發現 1、判斷題 J4、J7 |
| 上一個專案 | 08 skill 差異報告 → 使用者決定 → 換；09 刪 `.local/tools/`、`.local/claude-mods/` | spec 第 2、7 題 |
| E2E | 10 通用 skill＋實驗 | 使用者原話 |
| 教訓 | 11 `docs/agents/lessons.md` 補這輪踩的坑 | 段 2 中途發現 2、段 8 中途發現 1、6 |
| VM | 12 開一次：PR #6 的 5 項、走一次出門／回家、VM 上舊的關機同步收掉 | PR #6 手動檢查清單 |

審查（`/matt-code-review`）、PR、合併照 kickoff。

## 不能違反

- **上一個專案一律不能壞**：它的資料夾、分支、worktree、正在用的設定都不動；動它的 repo 只照它自己的 `CLAUDE.md` 開 PR（只有 08 會）。實驗在另一份 clone。
- **guard 的改動**：01 只會多問。02 是「少問」（拿掉誤判），用**白名單**：只有確定不會執行的指令（`echo`、`git commit -m`、`gh pr create --body`、`grep` 等）的引號參數、與餵給 `cat`／`tee`／`git commit -F -` 的帶引號 heredoc 內文不算；
  其他一律照現在掃。**真的會執行的一律照舊要問**（issue 02 判準 3 的清單：shell 包一層、`$(…)`、遠端、直譯器呼叫 shell、PowerShell 等），每一條有守住的測試。
- 既有測試一條都不改就要全過；要改的先停、問主控（寫進 spec「允許改的既有測試」再改）。
- 公開 repo（這個）不帶真名、帳號、email、金鑰、VM host／GCP 專案 id／zone／instance 名；查私人檔只看檔名、`--numstat`、挑過的行。
- VM 只開一次（12），用完關機。

## 允許改的既有測試

| 哪裡 | 可以改什麼 | 為什麼 | 誰同意 |
|---|---|---|---|
| 客廳 `tools/mods.test.mjs`、`tools/devbox-mods.test.mjs`（05 J8） | 只改 import 與 setup 行（把 `git`／`write`／`read` 小工具改成從 `tools/helpers-for-tests.mjs` import），**斷言不改** | J8 把兩份抄的小工具抽出去 | 主控 2026-10-29（過目抓到的 05） |
| 客廳 `tools/*.test.mjs` 四支（05 J3） | 「讓 autosync 可以被 import」需要的話，只改複製腳本進假客廳的 setup 行，**斷言不改** | 05 讓 `autosync.mjs` 可以被 import、export `mainDir` | 主控 2026-10-29 |
| 客廳 `tools/autosync.test.mjs`、`tools/devbox-mods.test.mjs` 段 2 加在檔尾的 `releaseLater`、`midRebase`、`hook`（05 J8） | 拿掉自己那一份、改成從 `tools/helpers-for-tests.mjs` import，**斷言不改** | 段 2 又各抄了一份 | 主控 2026-10-29（段 3 的開場） |
| 客廳 `tools/devbox.test.mjs` 的 `vmSetup`（段 7，段 2 中途發現 1） | 只改放進假 VM 的那支假 `autosync.mjs` 的內容：帶 `--strict` 時跑 `git -C <--project>/.local pull -q --rebase`、照它的 exit code 結束、不印「記憶與開場接回來了（假的）」；其他參數照舊。**斷言不改** | 出門的 VM 那一半 `.local` 的 pull 搬進 autosync，以前什麼都 exit 0 的假程式讓「VM 上 .local 拉不下來 → 停下來，不接記憶」變紅；真 autosync 的情境由 `devbox-mods.test.mjs` 新加的一條＋既有「兩台改了同一個檔」守 | 主控 2026-10-29（段 7） |

段 3 實際改的：J3 不用改 setup 行（四支照舊只複製 `autosync.mjs`／`devbox.mjs`，`devbox.mjs` 06 才 import `autosync.mjs`，兩支本來就一起複製）；J8 只動了上面兩列寫的 import 與小工具定義。

（段裡要再加的，寫明哪一條、為什麼，先問主控。）

## 行為會變的

（段裡寫：哪個指令、以前怎樣、現在怎樣。）

### 01 guard 補少問洞（客廳 `d3bc4a0`；只會多問）

| 寫法 | 以前 | 現在 |
|---|---|---|
| `project.json` 是合法 JSON、`neverWrite` 壞掉：`{}`、`null`、字串、`true`、`[{}]`、`[null]`、`["baobu-app"]`、`[{"firebaseProject": 1}]`、`[{"firebaseProject": ""}]`、`[{"gitRepo": ""}]`、`database`／`gitRepo` 不是不空的字串、`why` 不是字串 | 不是陣列當 `[]`、不合格的項目濾掉，**不標讀不懂**：國王日記那道保護默默消失（`gcloud firestore import … --project=baobu-app`、推國王日記的 repo 都不問） | ＝讀不懂：碰 Firebase／`gcloud`（模擬器除外）、`git push`、`gh` 寫入一律要問，框上寫「`.claude/project.json` 讀不懂，先修好（neverWrite 那一欄格式不對…）」；特例換成最嚴預設＋這份檔自己的 `writeScripts`／`npmScripts`；合格的項目照樣擋 |
| `npx -y firebase-tools@latest deploy …`、`npx firebase-tools firestore:delete …`、`npm exec firebase-tools -- deploy`、`npm x`、`pnpm dlx`／`exec`、`yarn dlx`／`exec`、`bunx`、`bun x` 跑的 `firebase-tools` | 完全認不出：不問、不記 | 跟 `firebase <子指令> …` 同一種判斷（要問的問、碰了什麼照記） |
| `firebase.cmd …`、`firebase.exe …`、`firebase.ps1 …`、`firebase.js …` | 認不出 | 跟 `firebase …` 同一種判斷 |
| firebase 全域旗標寫在子指令前面：`firebase --project prod deploy`、`firebase -P baobu-app firestore:delete …`、`firebase --debug deploy …` | 子指令被當成旗標（`--project`），只記一筆讀、不問 | 子指令認成 `deploy`／`firestore:delete`，跟旗標寫在後面同一種判斷 |
| `gcloud` 全域旗標寫在 `firestore` 前面：`gcloud --project=baobu-app firestore import …`、`gcloud --quiet --project=… beta firestore import …` | 認不出，不擋 | 照 `neverWrite` 擋（跟寫在後面同一種判斷；`export` 照舊不問） |
| `firebase -P prod`（只有旗標、沒有子指令） | 記一筆讀「firebase -P」 | 記一筆讀「firebase prod」（都不問，只是記的字不同） |

### 02 guard 確定不會執行的字不當成指令（客廳 `3950996`；少問）

只在 Bash 指令；PowerShell、Bash 讀不懂的（引號沒關、heredoc 沒結束、括號沒對上、有 `case`）照舊掃整串。

不再問的：

| 寫法 | 以前 | 現在 |
|---|---|---|
| `echo`、`printf`、`grep`、`egrep`、`fgrep`、`rg` 的引號參數裡寫到 firebase CLI、firestore 網址、`git push <國王日記 repo>`、`gcloud firestore import … --project=baobu-app`、`rm -rf`、`paypal`、`node <寫入腳本>`：`echo "git push <國王日記 repo>.git main"`、`grep -n "gcloud firestore import --project=baobu-app" file`、`echo '$(firebase deploy)'`（單引號不會執行） | 當成真的要跑：要問、記成碰了 Firebase | 不問、不記 |
| `git [-C 資料夾] commit` 的 `-m`／`-am`／`--message`、`git tag -m`、`gh pr\|issue create\|edit` 的 `--title`／`-t`／`--body`／`-b` 的引號內容，含 `"$(cat <<'EOF' … EOF)"` 的內文：`git commit -m "fix firebase deploy"`、`git commit -m "add paypal"`、`git commit -m "run node scripts/restore-backup.mjs"`、推 main 就部署的專案裡 `git commit -m "改完再 git push"`（以前 register 去問 git 現在在 main → 當成推 main） | 同上 | 不問、不記。`gh issue create／edit` 本身「傳出去」照舊問；`gh pr create --repo <國王日記 repo>` 照舊擋 |
| 帶引號分隔字（`<<'EOF'`、`<<"EOF"`、`<<\EOF`）的 heredoc 餵給 `cat`、`tee`、`git commit -F -`：`cat <<'EOF' > notes.md`＋內文 `gcloud firestore import … --project=baobu-app`、`cat >> 筆記 <<'EOF' … && git add … && git commit -m …`、`git commit -F - <<'MSG'` | 同上 | 不問、不記 |
| 環境只看同一段：別段寫到的正式站 id／網址不再讓這一段跟著認：`node scripts/reset-staging.mjs --project staging 2>&1 \| tail; curl <正式站網址>`（上一個專案過去的指令裡有一條） | 整串有正式站 id → 這一段的腳本當成寫正式站，要問 | 這一段自己寫了 `--project staging` → staging，不問 |

以上都要「這一段的輸出不會被拿去執行」才遮：`|` 只接到 `cat`、`tee`、`grep`、`rg`、`head`、`tail`、`wc`、`uniq`、`cut`、`tr`、`nl`、`clip`、`column`；這一層沒有括號、`{ }`、`if`／`for`／`while`、`coproc`、`exec`、process substitution、重導向到 1、2 以外的 fd；寫了檔案的話，檔名不像 hook、不是點開頭，而且這串指令的其他段都只是 `git`（不帶 `-c`）、`gh`、`cat`、`ls`、`cd`、`mkdir` 這種不會執行東西的；`printf -v`、`rg --pre` 不算。引號裡的 `$(…)`、反引號照樣當指令看。
其他寫法（`bash -c`、`| bash`、`ssh`、`node -e`、`python - <<'EOF'`、不帶引號的 heredoc、`timeout`／`sudo` 包一層…）一律照舊，`tests/not-executed.test.ts` 逐條跟改之前比。

多問的（環境只看同一段＋同一層前面 `export` 的段）：

| 寫法 | 以前 | 現在 |
|---|---|---|
| 別段的 `demo-`：`git commit -m "add demo-page" && firebase deploy --project baobu-app`、`git checkout demo-x && firebase deploy`、`cd demo-site && npm run restore -- b.json`、`ls demo-data; firebase firestore:delete -r / --project baobu-app` | 整串有 `demo-` → 當成模擬器，不問（國王日記那道 `neverWrite` 也跟著跳過） | 照這一段自己的環境：要問 |
| 別段的 `--project staging`、staging 的專案 id：`node scripts/restore-backup.mjs b.json; echo "--project staging"`、python heredoc 內文寫到 staging id 之後 `node --check scripts/seed-staging.mjs`（上一個專案過去的指令裡有 2 條） | 整串有 staging → 當 staging，不問 | 這一段看不出 → 要問 |
| （段 9，段 8 審查第 4 條，客廳 `dce741f`）帶引號 heredoc 寫進 git hook 名字的檔（`tools/pre-push.mjs`、`scripts/pre-commit`、`commit-msg`…，有沒有副檔名都算）或 `.github/` 底下的檔，同一串接 `git commit`／`push`／`pull`：`cat <<'EOF' > tools/pre-push.mjs`＋內文 `firebase deploy`＋`&& git commit -m x && git push` | 02 之後：檔名不帶 hook／husky、其他段都是 `git` → 內文遮掉，不問（hook、CI 同一串就會跑） | 不遮，照 02 之前掃內文：要問 |

拿過去對話裡真的跑過的 Bash 指令量過（只算筆數）：這個專案 1689 條，少問 3 條（都是上面的誤判）、多問 0；上一個專案 14066 條（它的規則），少問 2、多問 2（就是上面寫的），16 條讀不懂照舊掃整串。

### 03 autosync 嚴格模式、devbox 家裡與 presync 看 exit code（客廳 `b5631ea`）

| 哪裡 | 以前 | 現在 |
|---|---|---|
| `autosync.mjs --strict`（新的） | 沒有（不認得的旗標：跑到背景、馬上 exit 0） | 前景；`.local` 沒有要推的也拉；拿不到鎖等最多 30 秒；任何一步沒做成 exit 1、stderr 一行「`<專案>/.local：<哪一步>：<原因>`」 |
| 不帶 `--strict`（對話開始／結束的 hook）的 `tools/autosync.log` | 出錯那行只有 git 的最後一行（常是 `hint:`）；推不上去是「沒推成：<推的原因>（pull --rebase 沒成功：<拉的原因>）」 | 多了哪個專案哪一步、取 git 的 `fatal:`／`error:` 那行；推不上去是「沒推成：pull --rebase 沒成功：兩台改了同一個檔（檔名），回到拉之前」。exit code 照舊 0 |
| 出門：家裡的 `.local` 推不上去 | 停：「家裡電腦的 X/.local 沒推成，看客廳 tools/autosync.log 最後幾行」 | 停：「家裡電腦的 X/.local 沒推成：X/.local：<哪一步>：<原因>」＋「VM 還沒開，處理完再按一次「出門」」 |
| 出門：家裡的 `.local` 正被對話結束的同步拿著鎖 | 跳過這次；有沒推的就停在「沒推成」 | 等它做完（最多 30 秒）再推，照常出門 |
| presync：某個專案的 `.local` 沒推成 | 「X：沒推成：.local 沒推上去（看 ~/claude-home/tools/autosync.log）」；拿不到鎖直接算沒推成 | 「X：沒推成：X/.local：<哪一步>：<原因>」；拿不到鎖等最多 30 秒（還在那個專案的 35 秒限時裡） |
| `--restore-mods` 等鎖 | 寫死 30 秒 | 一樣 30 秒（跟 `--strict` 共用 `LOCK_WAIT`；測試可以用 `AUTOSYNC_LOCK_WAIT_MS` 換短） |

### 04 回家的家裡那一半 `.local` 用嚴格模式接（客廳 `0ef32ab`）

| 情況（回家、家裡那一半） | 以前 | 現在 |
|---|---|---|
| 家裡 `.local` 有沒推的 commit（或沒 commit 的檔）、VM 推了別的檔 | `pull --ff-only` 失敗 → 停：「家裡電腦的 X/.local 拉不下來（兩台都改過同一份？）」 | 家裡的先 commit、接在 VM 推的後面、推上去，接回記憶與開場，照常回家 |
| 兩台改了同一個檔 | 停（同上），不跑 `--restore` | 停：「家裡電腦的 X/.local 沒接好，記憶與開場還沒接回來：X/.local：沒推成：pull --rebase 沒成功：兩台改了同一個檔（檔名），回到拉之前」，不跑 `--restore`；沒 commit 的檔會被 commit 進 `.local`（沒推） |
| 對話結束的同步正拿著 `.local` 的鎖 | 不理鎖，照拉（可能撞 `index.lock`） | 等它做完（最多 30 秒）再接；等不到就停、不跑 `--restore` |
| 家裡 `.local` 什麼都沒變、VM 推了新的 | `pull --ff-only` | 一樣拉下來（嚴格模式），多跑一次記憶與開場的複製（沒變就不 commit） |

### 05 客廳 tools 異味整理（客廳 `baebee3`）

J3（算一次 mode、可以被 import）、J6（`vm-state.json` 的字收成常數）、J8（測試小工具）不改行為；下面是會變的：

| 哪裡 | 以前 | 現在 |
|---|---|---|
| `autosync.mjs --no-mods`（J2 新名字） | 不認得：照樣做 mods 那一半 | 只做專案那一半；舊名字 `--no-home` 這一輪照樣認（下一輪拿掉） |
| devbox 叫家裡的 autosync（`pushLocal`、`pullLocal`）、VM 上 presync 叫的 | `--strict --no-home` | `--strict --no-mods`（家裡與 presync 用的是同一台的新版 autosync） |
| 回家（VM 開著）`vmState` 經 ssh 叫 **VM 上的** autosync | `--now --no-home` | `--now --no-home --no-mods`：VM 的客廳可能還沒 pull，舊版只認 `--no-home`、新版兩個都認，**都不會多做一次 mods 備份** |
| 回家的家裡那一半：`.local` 接好了、`--restore` 出錯（段 2 中途發現第 2 條，主控決定 05 修） | 停：「出錯了：Command failed: <node 路徑> <autosync 路徑> --project … --restore」，看不到原因 | 停：「家裡電腦的 X/.local 接好了，記憶與開場沒接回來：接回來的時候出錯了：<原因>」＋「叫 Claude 看一下，處理完再按一次「回家」」；跟以前一樣停在家裡的程式碼動之前 |
| autosync 同時帶好幾個模式旗標（J3） | 每個旗標各自是開關（例如 `--dry-run --strict` 兩個都算） | 照 `--restore`、`--check-mods`、`--restore-mods`、`--dry-run`、`--strict` 的順序取第一個。以前就是這個先後的，只有 `--dry-run --strict` 一起帶時不同（現在只當試跑）；devbox 與 hook 都只帶一個 |
| `import` `autosync.mjs`（J3） | 一 import 就跑、最後 `process.exit` | 什麼都不做；export `mainDir`（06 用）。直接執行（hook、devbox、手動）照舊 |
| limit-guard：worktree 的 `.git` 寫相對路徑（`gitdir: ../../../.git/worktrees/x`，git 2.48 起的 `--relative-paths`／`worktree.useRelativePaths`）（J5） | 開場寫到 `handoffs/../`（主資料夾名算成 `..`） | 寫到 `handoffs/<主資料夾名>/`，跟 `mainDir` 同一份案例（`mods/limit-guard/tests/fixtures/worktree-cases.ts`） |

### 06 devbox `--project` 是 worktree 時看主資料夾（客廳 `52da7a7`）

| 情況 | 以前 | 現在 |
|---|---|---|
| 出門／回家帶 `--project <清單上專案的 worktree>`（在 worktree 開的對話按儀表板） | 多印一行「⚠️ <worktree 名> 還沒加進 VM 的清單…」（照樣處理清單上每一個專案） | 不印 |
| `--project <清單上專案底下的子資料夾>` | 印「還沒加進清單」 | 不印（同一個 repo） |
| `--project` 不在清單上（不存在的資料夾、別的 repo 或它的 worktree） | 印 | 照舊印 |

### 07 儀表板「雲端」分頁（客廳 `3d925e7`）

| 哪裡 | 以前 | 現在 |
|---|---|---|
| 「雲端」分頁第一張卡的標題 | 寫死 VM 的名字 | 客廳 `vm/devbox.json` 的 `instance`（現在的值跟以前寫死的一樣，畫面上看起來不變）；讀不到、沒有、不是字串或空的寫「雲端 VM」 |
| 按鈕底下「在 X 按的」（在 worktree 開的對話） | X 是 worktree 的資料夾名 | X 是主資料夾名（引擎的 `$.session.repo()`）；`--project` 照舊帶 worktree 的路徑 |
| 剛打開分頁、還在問 devbox.mjs status 的那一下 | 標題是寫死的名字 | 標題先是「雲端 VM」，讀到 `devbox.json` 換成名字（同一次重整裡，幾乎看不到） |

J7 其他的改名、J4 的測試不改行為。

### 段 2 中途發現 1：出門的 VM 那一半 `.local` 用嚴格模式接（客廳 `62adaf0`，段 7）

| 情況（出門、VM 那一半） | 以前 | 現在 |
|---|---|---|
| VM `.local` 有沒 commit 的檔、家裡推了同一個檔 | `pull --rebase --autostash` 套回衝突也 exit 0：檔裡留衝突記號、stash 留著，接著 `--restore`、印 ✅ | 停：「VM 上 X 沒接好，停在這裡：…（autosync 說的原因，含檔名）」；不跑 `--restore`、VM 改的被 commit 進 VM 的 `.local`（沒推）、不停在 rebase 到一半、VM 開著 |
| VM `.local` 有沒推的 commit（或沒 commit 的檔）、家裡推了別的檔 | 接在家裡的後面，**留在 VM 上沒推**（之後的自動同步推） | 接在家裡的後面、**出門當下就推上去** |
| 兩台改了同一個檔（都是 commit） | `rebase --abort`、停 | 一樣停（autosync abort），原因多帶檔名 |
| VM 開機時對話開始的同步正拿著 `.local` 的鎖 | 不理鎖，照拉（可能撞 `index.lock`） | 等它做完（最多 30 秒）再接；等不到就停、不跑 `--restore` |

### 13 guard 刪東西時救得回來的不問（客廳 `fbf35e9`；少問，少數多問）

| 寫法 | 以前 | 現在 |
|---|---|---|
| 同一串前面設了變數再刪暫存區：`S=<scratchpad>; …; rm -rf $S/exp`、`export T="$TEMP/x"; rm -rf "$T/out"`、`rm -rf $TMPDIR/x`；PowerShell `$S = "$env:TEMP\x"; Remove-Item -Recurse "$S\y"` | 刪的那一段沒有暫存區的字 → 問 | 不問 |
| git 追蹤、沒改過的檔或資料夾：`rm notes/old.md`、`rm -rf notes/`、`cd <資料夾> && rm old.md`、`Remove-Item -LiteralPath a, b` | 問 | 不問 |
| 建置產物：路徑裡有 `node_modules`、`coverage`、`test-results`、`playwright-report`、`blob-report`、`.pytest_cache`、`.nyc_output`、`__pycache__`（`.local`、`~/.claude` 底下的除外） | 問（`__pycache__` 以前就不問） | 不問 |
| 一段刪好幾個、其中有暫存區：`rm -rf important /tmp/x` | 整段有 `/tmp/` → 不問 | 一個一個看：`important` 救不回來 → 問（**多問**） |
| 變數看不出、路徑裡寫了 scratchpad：`rm -rf "$X/scratchpad/y"` | 不問 | 問（**多問**） |
| （段 9，段 8 審查第 1 條，客廳 `dce741f`）專案裡的 `tmp/` 子資料夾、名字帶 `scratchpad` 的 cwd：`rm -rf tmp/notes`、`cd tmp && rm x`、`Remove-Item -Recurse -Force tmp/notes`、cwd 是 `…/scratchpad-app` 時 `rm draft.md`（沒進 git） | 13 之後：接上 cwd 的路徑有 `/tmp/`、`scratchpad` → 當暫存區，不問 | 跟 13 之前一樣問；暫存區只認 hook 讀到的 `TEMP`／`TMP`／`TMPDIR` 底下，或寫的字本身（`/tmp/…`、`…AppData/Local/Temp…`、`scratchpad`、`.shot-tmp`）（**多問**） |
| （段 9，段 8 審查第 2 條）`.LOCAL`、`.Git` 這種大小寫不同的寫法：`rm -rf .LOCAL/claude-memory/x.md` | 不是 `.local` → 問 git → 在 git 裡沒改過就不問 | 跟 `.local`、`.git` 一樣照規矩要問（**多問**） |
| 要問的框上 | 「・刪檔案：rm -rf $S/exp」 | 「・刪 $S/exp（看不出 $S 是哪裡）」「・刪 2 個：draft.txt（沒進 git，救不回來）；notes/old.md（在 git 裡、沒改過，救得回來）」 |

照舊問：沒進 git、有沒 commit 的修改、底下有沒追蹤或被 ignore 的、子模組；`.local`、`~/.claude`、`.git`、整個專案或家目錄；萬用字元、`$(…)`、看不出的變數、算不出的 cd；git 問不到；`git clean`、`reset --hard`、`checkout --`／`restore`、`branch -D`、強推、程式裡刪檔案（照舊只看字）。

拿過去真的跑過的刪除指令量（段 3b 續，路徑照當時的 cwd、git 用現在的狀態）：這個專案 58 條少問 19、多問 1；上一個專案 227 條少問 13、多問 14（多問都是 cd 沒有一路 `&&` 接到 rm、變數可能被改過、萬用字元）；cwd 或檔案已經不在的「找不到」50 條、「問不到 git」1 條，都本來就問。


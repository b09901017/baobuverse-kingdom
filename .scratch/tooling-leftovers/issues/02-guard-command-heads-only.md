# 02 guard：確定不會執行的字串不當成指令（白名單）

Status: done
Blocked by: 01（同一個檔，01 先）
動工前先讀：`.scratch/legacy-to-home/HANDOFF.md`「中途發現」段 1 第 1 條、段 8 第 2、5 條；這份 spec「不能違反」guard 那一條；這份 HANDOFF「過目抓到的」02；
客廳 `mods/guard/hooks/classify.ts`（firebase CLI `:243`、`EMULATOR.test(cmd)` `:251`、`envOf(cmd)` `:238`、`gitRepoRisks` `:175`、`GH_WRITE` `:164-165`、`gcloud` `:285`、`node -e`／heredoc `:316-325`、REST `:328`、`deletes` `:209-232`、`pay` `:360`、`mainDeploysProd` `:344`、`scriptPaths`／`npm run` `:199-204,293`）、
客廳 `mods/guard/hooks/register.ts`（`remoteRisks` `:74-86`、`branchRisks` `:89-113`）、`mods/guard/tests/fixtures/parity-cases.ts`

## 使用者要的

> 下一輪，候選清單就一起做吧，全部完成

（第 3 階段時使用者對「guard 把指令文字裡的 `firebase deploy` 當成指令」答「照建議」：下一輪修。10/29 段 8 用 heredoc 寫測試字串時跳出「Claude 要寫絕對不能寫的地方」的框，使用者嚇了一跳。）

## 為什麼會這樣

這些規則都掃**整串指令文字**：`git commit -m "…firebase deploy…"`、`gh pr create --body "…"`、`python - <<'EOF'` 的內文寫到這些字，都被當成真的要執行。
環境也看整串（`EMULATOR.test(cmd)`、`envOf(cmd)`）：`git commit -m "add demo-page" && firebase deploy` 因為整串有 `demo-` 被當成模擬器、**不問**（這半是少問洞，跟這支一起修）。

## 做法（白名單，不寫完整的 shell 剖析器）

1. **切段**：`;`、`&&`、`||`、`|`、`|&`、單一個 `&`（跟 `2>&1`、`&>`、`>&2` 分開）、換行。**引號不會開始新的一段，但仍是這一段的參數**（`curl -X PATCH "https://firestore…"` 照舊算寫入）。
2. **只有兩種情況把文字拿掉，其他一律照現在掃整段**：
   - 確定不會執行的指令的引號參數：`echo`、`printf`、`git commit -m`／`-F -`、`git tag -m`、`gh pr|issue create|edit` 的 `--title`／`--body`、`grep`／`rg`；而且這一段沒有被 `|` 接到 shell、直譯器或 `xargs`。
   - 帶引號分隔字（`<<'EOF'`、`<<"EOF"`）、餵給 `cat`／`tee`／`git commit -F -` 的 heredoc 內文。
   引號參數裡有 `$(…)` 或反引號（雙引號）時，**那一段 `$(…)` 照樣當指令看**；最常見的 `git commit -m "$(cat <<'EOF' … EOF)"` 是「`$(…)` 會執行、裡面的 `cat <<'EOF'` 是資料」。
3. **環境只看同一段**（加上那一段前面的 `VAR=…`）：`EMULATOR`、`envOf` 不再看整串。
4. **PowerShell 照舊掃整串**（反引號是跳脫字元、`{ }`、`&`、here-string 另一套規則）。
5. 範圍：firebase CLI、REST、`neverWrite` 的 `git push`／`gh`／`gcloud`、`pay`、`mainDeploysProd`、`scriptPaths`／`npm run`、`register.ts` 的 `remoteRisks`／`branchRisks` 都用同一套切段與白名單。
   `deletes` 裡「程式裡刪檔案」那條（`:216`）本來就要看程式內文，**不套白名單**。已有的 `node -e`／heredoc 判斷（`:316-325`）不切段，不要照它的寫法統一，改成用這套切段。

## 判準

1. 誤判要消失（這個 repo 的 `project.json`，各寫明規則與指令）：
   `git commit -m "fix firebase deploy"`、`git commit -m "$(cat <<'EOF'`＋內文 `firebase deploy --project <正式站>`＋`EOF`＋`)"`、`gh pr create --body "$(cat <<'EOF' … git push <neverWrite repo> … EOF)"`、
   `cat <<'EOF' > notes.md`＋內文 `gcloud firestore import … --project=baobu-app`、`echo "git push <neverWrite repo>.git main"`、`grep -n "gcloud firestore import --project=baobu-app" file`、`git commit -m "add paypal"`（`pay`）、
   `git commit -m "run node scripts/restore-backup.mjs"`（`scriptPaths`）→ 都不問、也不記成碰了 Firebase。每條先紅（現在會問）再綠。
2. 少問洞要補（先紅）：`git commit -m "add demo-page" && firebase deploy --project <正式站>`、`node scripts/restore-backup.mjs b.json; echo "--project staging"` → 要照第二段自己的環境判斷。
3. 照舊要問（防退步；寫明規則與指令，現在就問，所以是**守住的綠燈測試**，改完還要綠）：
   - shell 包一層：`bash <<EOF`＋`firebase deploy`、`bash -c`／`-lc`／`-ec`、`sh -c`、`sh -s <<EOF`、`bash <<< "firebase deploy"`、`echo "firebase deploy" | bash`、`curl … | sh`、`eval "…"`、`xargs firebase deploy`、`find . -exec firebase deploy \;`
   - 包一層再跑：`timeout 60 firebase deploy`、`nohup`、`sudo`、`nice`、`time`、`command`、`exec`、`watch`、`env X=1 firebase deploy`、`FOO=1 firebase deploy`
   - 套件執行器：`npx firebase deploy`、`npm exec`、`npm x`、`pnpm dlx`、`yarn dlx`、`bunx`、`npx -p firebase-tools firebase …`
   - 指令替換：`$(firebase deploy)`、`` `firebase deploy` ``、`git commit -m "$(firebase deploy)"`、不加引號的 `cat <<EOF` 內文裡的 `$(firebase deploy)`
   - 遠端與容器：`ssh host "git push <neverWrite repo>.git main"`、`ssh host <<EOF`＋同一行、`gcloud compute ssh vm --command "firebase deploy"`、`docker exec`、`wsl -e`
   - 直譯器呼叫 shell：`node -e "require('child_process').execSync('firebase deploy --project <正式站>')"`、`python -c "import subprocess; …"`、`python - <<'EOF'`＋`subprocess.run(['firebase','deploy'…])`
   - PowerShell：`pwsh -c "firebase deploy"`、`powershell -Command`、`powershell -enc <base64>`（掃不了 → 要問）、`Invoke-Expression`、`Start-Process firebase -ArgumentList deploy`、`& { firebase deploy }`
4. 既有 guard 測試（38＋01 新增的）一條都不改就全過；`legacy-parity`、`strict-default` 每一條判斷不變。
5. 這是「少問」的改動：改完在 spec「行為會變的」逐條列出不再問的寫法。拿不準算不算「會執行」的，當成會執行（照舊掃），記進中途發現。

## 做完時留下的（段 1 續，客廳 `3950996`）

- **切段**：`classify.ts` 加一個小的 Bash 切段器 `parseShell`：認單／雙引號、`$'…'`、`$(…)`、反引號、`${…}`、heredoc（`<<-`、在 `$(…)` 裡、一行好幾份）、重導向（`2>&1`、`&>`、`>|`…）、註解、`\` 換行。讀不懂就丟錯，`readable` 接住、照舊掃整串。PowerShell 不切。
- **遮字**：`maskShell` 把白名單的字換成空白（**位置不變**），每一條規則比對遮過的 `text`，框上寫原本的字（`shown(cmd, m)`）——沒遮到的指令 `why` 一字不差，legacy-parity 的逐條比對照過。
  白名單照 issue：①`echo`／`printf`／`grep`／`egrep`／`fgrep`／`rg` 的所有引號參數；`git [-C 資料夾] commit|tag` 的 `-m`／`-am`／`--message`（含 `-m"…"`、`--message=…`）；`gh pr|issue create|edit` 的 `--title`／`-t`／`--body`／`-b`（含 `=`）。②`cat`、`tee`、`git commit -F -` 的帶引號 heredoc 內文。前面的 `VAR=…` 跳過。
- **輸出不會被執行才遮**：`|` 只接到只印字的（`SINK`：`cat`、`tee`、`grep`、`rg`、`head`、`tail`、`wc`、`uniq`、`cut`、`tr`、`nl`、`clip`、`column`）；這一層沒有括號、`{ }`、`if`／`for`／`while`／`case`、`coproc`、`exec`、process substitution；沒有重導向到 1、2 以外的 fd。
  `$(…)` 裡的只有在被遮的參數裡才遮（`git commit -m "$(cat <<'EOF' …)"`）；`bash -c "$(cat <<'EOF' …)"`、`x=$(…)`、`eval "$(…)"` 裡的不遮。
- **環境只看同一段**：firebase CLI 的模擬器判斷、腳本與 `npm run` 的環境與「自己寫了 `--project`」都看「這一段自己的字（`$(…)` 另算）＋同一層前面 `export` 的段」。`neverWrite` 的「有沒有提到 baobu-app」照舊看整串（遮過的），不縮成一段。
- `node -e`／heredoc 那一條改成一段一段看（`segs`），不再用整串的 regex。`deletes` 的「程式裡刪檔案」照舊掃沒遮過的字。
- `register.ts`：新 export `runnable(cmd, shell)`，`remoteRisks`、`branchRisks`、讀腳本都用遮過的字。
- **測試**：`tests/not-executed.test.ts` 7 條；`tests/fixtures/classify-d3bc4a0.ts`＝改之前（01 做完）的 `classify.ts`，一字不改。
  判準 1 的 9 條＋同一類 19 條：改之前會問（測試也驗這一點）、改完 `{ risks: [], touches: [] }`；判準 2 的 8 條：改之前不問、改完要問；判準 3 的清單＋自己想到的，共 102 條：四種規則（這個專案、最嚴預設、上一個專案、讀不懂）下每一條判斷跟改之前**一模一樣**、這個專案下都要問；接起來 2 條走 `register.ts`。
  guard 49 → 56，既有 49 條一字不改；tsc 0 錯、validate 過；limit-guard 52 全過。
- **拿過去真的跑過的指令量**（只印筆數與遮過的形狀）：這個專案 1689 條，全部讀得懂、最慢 5 ms，少問 3（`cat >> 筆記 <<'EOF'`、`git commit -F - <<'MSG'` 的誤判）、多問 0。上一個專案 14066 條（它的規則），16 條讀不懂照舊掃整串，少問 2、多問 2（spec「行為會變的」02）。

跟 issue 寫的不同：

1. **判準 3 有兩種改之前就不問**：python 用串列叫 `subprocess.run(['firebase', 'deploy', …])`（firebase 的 regex 要後面接空白）、`powershell -enc <base64>`（看不到字）。issue 當成「照舊要問」；這支沒加（會多問、不在範圍），測試只守「改完跟改之前一樣」，記進 HANDOFF 中途發現。判準 3 的 python 那條改用會問的 `subprocess.run('firebase deploy …', shell=True)`。
2. **判準 1 的規則**：`git commit -m "run node scripts/restore-backup.mjs"` 在這個 repo 的 `project.json` 下本來就不問（沒寫 `writeScripts`），改用最嚴預設；其他用這個 repo 的。每一條的規則寫在測試裡。
3. **環境多看「同一層前面 `export` 的段」**：issue 寫「加上那一段前面的 `VAR=…`」。`export FIRESTORE_EMULATOR_HOST=…; firebase deploy` 真的會帶過去，只看同一段會多問；`export GCLOUD_PROJECT=<正式站>` 也照樣認成正式站（不會少問）。沒有 `export` 的 `VAR=…;` 不算（子程序看不到）。
4. **寫出去的檔案多一道關**：issue 只說「餵給 cat／tee」。做的時候發現寫進檔案、同一串再執行它（`bash run.sh`、`make`、`npm install`、`cat run.sh | bash`、git hook、`git -c core.fsmonitor=…`）會被遮掉，所以寫了檔案時：檔名不像 hook（`hook`、`husky`）、不是點開頭，而且這串指令的其他段都是不會執行東西的（`CALM`：`git` 不帶 `-c`、`gh`、`cat`、`ls`、`cd`、`mkdir`…）。`cat <<'EOF' > notes.md && git add … && git commit …` 照樣遮。
5. **自己找到、不遮的**：`printf -v`（存進變數，之後可能 `eval`）、`rg --pre`（拿檔案去跑別的指令）、`sort --compress-program`（所以 `sort` 不算只印字）；`case` 一律當讀不懂（`pattern)` 會讓 `$(…)` 提早結束，`git commit -m "$(case … in a) firebase deploy;; esac)"` 會被遮掉）。都有守住的測試。
6. `gh issue create／edit` 本身是「傳出去」照舊問，只是引號裡的字不再多算一條。

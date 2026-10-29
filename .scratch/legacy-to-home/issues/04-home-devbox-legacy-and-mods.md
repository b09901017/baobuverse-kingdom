# 04 客廳的出門／回家：上一個專案走通用流程，mods 改從客廳搬

Status: todo
Type: task
Blocked by: —

## 動工前先讀

- [`../spec.md`](../spec.md)「之後的樣子」「換手的順序」「使用者選的答案」第 5、7 題、「行為會變的」
- 客廳 `tools/devbox.mjs`（`pushLocal` `:146-152`、`checkVmState` `:190`、回家讀 `vm-state.json` `:282`、presync `:322-345`）、`tools/devbox.test.mjs`、
  `tools/autosync.mjs`（`syncProject` 只 commit `claude-memory`／`claude-handoffs`、`backupMods` `:235-250` 先 `pull` 再鏡像再推、只在 win32）、
  `vm/README.md`、`vm/devbox.json`（**私人值，不要印出來、不要抄進公開 repo**）、`vm/claude-home-presync.service`、`vm/add-project.sh`、`vm/existing/devbox-presync*`
- 上一個專案 `.local/tools/devbox/devbox.mjs`、`.local/tools/sync-claude.mjs`、`.local/tools/autosync.mjs`（**唯讀**，這一輪不改）：它的出門／回家／關機同步實際做了哪幾步
- 上一個專案的 `CLAUDE.md`（正式站備份要放 `.local/references/`）
- 客廳 `docs/project-config.md`、`README.md`（`:34-40`、`:79`）
- `docs/agents/lessons.md` 第一條（「回家」把家裡切到 VM 的舊分支）
- `.scratch/claude-home-workflow/HANDOFF.md`「段 6 審查結果」② ③ ⑦ 與「段 7 狀態」（② ③ 的修法）

## 使用者要的

> 我只要更新客廳的東西，我的所有專案都可以更上

> 不要影響到上個專案，畢竟那個專案還在進行中還在維護測試

第 5 題（最後開 VM 走一次）：可以。第 7 題：上一個專案的舊工具不改、不刪，只是不再叫；VM 上它的關機同步停用。

## 為什麼會這樣

- 客廳的 `devbox.mjs` 出門／回家時，上一個專案是叫**它自己的** `devbox.mjs`（`devbox.json` 的 `legacy`），其他專案走通用流程。
- mods 跨機器的搬運靠上一個專案的 `.local/claude-mods/`：家裡的 hook 備份進去，VM「出門」時它的 `sync-claude.mjs --restore` 鏡像回 VM，
  VM 關機時它的 presync 再備份回去，「回家」再 `--restore`。客廳的 `autosync.mjs` 只在 Windows 單向備份 mods 進客廳，從不寫回。
- 上一個專案的 `.local` 不只記憶與開場：它的舊同步是 `git add -A`，10 月的自動同步有 5 次動到 `references/`、8 次動到 `tools/`。
  客廳的通用版只 commit 記憶與開場，換手之後那些檔沒人推；而通用流程的 `pushLocal`／`checkVmState` 看到 `.local` 有沒 commit 的檔就停 → 上一個專案出門、回家都會卡住。
- 05 之後全域 hook 不再叫上一個專案的同步，`.local/claude-mods/` 就不再更新；所以**在 05 之前**，mods 的來回必須改由客廳做，不然 VM 出門會拿到舊 mods。

## 做法

1. **先對照**：把上一個專案 `devbox.mjs` 的出門與回家（家裡那一半、VM 那一半、VM 關著時的回家）每一步列成表，跟客廳通用流程對一次；
   通用流程少的步驟補進通用流程（照 `project.json`／`devbox.json` 的資料，不寫死）。表寫進「做完時留下的」。至少要涵蓋：
   - VM 關著時回家：舊流程讀 `vm-state.txt`，通用流程讀 `vm-state.json`（`:282`）。換手後第一次回家沒有 `vm-state.json`，`NaN < lastStart` 是 false → 不停、也不切分支。要決定第一次怎麼辦（例如讀得到舊的 `vm-state.txt` 就用它）。
   - VM 開著時回家：VM 那一半要真的備份 mods 進客廳，並確認推上去了。
   - mods 沒有 `package.json`，不用 `npm ci`。
2. **`.local` 整個同步**：客廳 `autosync.mjs` 的 `syncProject` 改成 commit `.local` 裡的所有變動（`git add -A`，照 `.local/.gitignore`），跟上一個專案舊的同步一樣。
   對每個專案都這樣（這個專案的 `.local` 其他檔也會自動推，寫進 spec「行為會變的」）；先確認這個專案的 `.local/.gitignore` 擋掉 log 之類的檔。
3. `devbox.json` 的 `legacy` 改成 `projects` 裡的一列（這個私人檔照實際改，值不要印出來）；`devbox.mjs` 拿掉 `legacy` 分支（段 6 審查 ⑦ 跟著消失）。
   `docs/project-config.md` 的 `legacy` 那一列拿掉。
4. **mods 從客廳搬，而且不准默默蓋掉另一台的**：
   - 出門（VM 那一半）：VM 上 `git -C ~/claude-home pull --ff-only` → 把客廳 `mods/` 鏡像回 VM 的 `~/.claude/mods`（不帶 `node_modules`、`.claude-plugin/types`，跟 `modsSkip` 同一套）。
   - VM 關機（presync）與 VM 上的對話開始／結束：VM 的 `~/.claude/mods` 備份進客廳並推（`backupMods` 不再限 win32）。
   - 回家（家裡那一半）：客廳 `pull --ff-only` → 客廳 `mods/` 鏡像回家裡的 `~/.claude/mods`。
   - **基準點**：`backupMods` 現在是先 `pull` 再整份鏡像再推 —— 兩台都能推之後，慢的那一台開一個對話就會把另一台改過的 mods 蓋回去（例如回家開 VS Code，SessionStart 一跑，VM 上改的就沒了）。
     改成：這台記下「上次跟客廳同步 mods 時的 commit」；`pull` 之後如果上游的 `mods/` 在那之後被改過、而這台還沒還原，**不備份、只寫 log**（要先回家／出門把那一份還原）。
   - 出門前、回家後都確認 mods 確實推上去了；任何一步失敗就整個停（`set -eo pipefail`，同段 6 審查 ② 的修法），不印「✅」。
5. VM 的關機同步：`claude-home-presync` 要依序處理每個專案（每個最多約 85 秒，`:322-345`）再加 mods，會超過 `TimeoutStopSec=80`：調整 timeout 或並行，寫進「做完時留下的」。
6. VM 上停用上一個專案的 `devbox-presync`、把 VM 的全域 hook 換成客廳的同步：**這一支只改客廳的檔**（`vm/` 底下的 unit、`vm/README.md` 寫清楚 VM 上要做的步驟），VM 上的實際改動在 issue 08。
   `devbox-presync` 是 `RemainAfterExit` 加 `ExecStop`：只 `disable` 這次關機照樣會跑、`disable --now` 會立刻跑一次 —— 步驟寫成「先用 drop-in 把 `ExecStop` 換成 `/bin/true`、`daemon-reload`，再 `disable`」。
7. 要更新的文件：客廳 `README.md:34-40,79`、`autosync.mjs:4,204-205` 的註解、`devbox.mjs:13-16,220`、`vm/README.md:8-18,28-34,59-66`、`vm/claude-home-presync.service:11`、`vm/add-project.sh:4`。

## 判準

- 出門時客廳的 `mods/` 比 VM 上的新：VM 的 `~/.claude/mods` 會不會變成客廳那一份？`node_modules` 會不會被刪掉？
- VM 上改過 mods、關機、回家：家裡的 `~/.claude/mods` 會不會變成 VM 改過的那一份？
- VM 上改過 mods 並推上客廳之後、家裡還沒回家就開了一個對話：家裡的 SessionStart 會不會把 VM 改的蓋回去？（不應該：只寫 log）
- 客廳 `pull` 失敗、鏡像失敗、mods 沒推上去：會不會照樣印「✅」？
- 上一個專案的 `.local/references/` 多了一個檔：自動同步會不會推上去？出門會不會因為 `.local` 有沒 commit 的檔而卡住？
- 上一個專案走通用流程之後，出門／回家對它做的每一步，跟它自己的 `devbox.mjs` 比，有沒有少一步、多一步、或順序不同（對照表）？換手後第一次在 VM 關著時回家呢？
- `devbox.json` 沒有 `legacy` 這一格之後，會不會有任何一個專案被不聲不響跳過？
- 客廳 `autosync.mjs --restore` 會不會碰到 mods？（不應該：mods 的還原是 devbox 的一步）

## 規矩

不開 VM（issue 08 才開，主控安排）。測試用假的 ssh（現有 `devbox.test.mjs` 的做法：把指令交給這台的 bash 在暫存資料夾的「VM」上真的跑）。
客廳 `node --test tools/devbox.test.mjs`、`node --test tools/autosync.test.mjs` 寫檔名跑（不要 `node --test tools/`）；既有測試不改全過。
`--dry-run` **不是唯讀**：它會改 `.local` 與客廳 `mods/` 的工作目錄（`autosync.mjs:248`）—— 對上一個專案要試，在暫存資料夾的複本上試。
**客廳的工具存檔就生效**：這一段改完到 08 做完之間，使用者不要按出門／回家（主控會跟使用者說）。

# 04 客廳的出門／回家：上一個專案走通用流程，mods 改從客廳搬

Status: done
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

## 做完時留下的（2026-10-29，段 3）

### 對照表（動程式之前做的）

「舊」＝上一個專案 `.local/tools/devbox/devbox.mjs`（＋它叫的 `autosync.mjs`、`sync-claude.mjs`、VM 上的 `devbox-presync`）；「通用（改之前）」＝客廳 `tools/devbox.mjs` 的 `projects` 那條路。
最右欄是這一段改完之後，上一個專案成了 `projects` 的一列時走的。

**出門**

| # | 舊 | 通用（改之前） | 差在哪 | 改完 |
|---|---|---|---|---|
| 1 | 家裡：程式碼沒 commit、分支沒推過、有 commit 沒推 → 停 | 同（`localCode`） | 沒差 | 同 |
| 2 | 家裡：`.local` 自動同步（記憶、**mods → `claude-mods/`**、開場平放那一層；`git add -A` 整個 `.local`）、推；`.local` 有沒 commit／沒推的就停 | 客廳 `autosync --now`：只 commit 記憶與 `handoffs/<資料夾名>/`；同樣檢查 | 通用的只 commit 兩格 → 上一個專案 `references/`、`tools/` 有變動就**卡在這一步**；mods 不經過 `.local` | `.local` 整個 `git add -A`（照 `.local/.gitignore`）；mods 改由客廳（下一列） |
| 3 | — | 客廳 `autosync --now` 順便在 Windows 把 mods 單向備份進客廳，不檢查 | 舊的靠 `claude-mods/` 帶 mods | 備份照基準點規則；**家裡這一半最後檢查 mods 跟 GitHub 上的客廳一樣**，不一樣就停在開 VM 之前 |
| 4 | 開 VM | 同 | 沒差 | 同 |
| 5 | — | VM：客廳 `pull --ff-only`，失敗只提醒一聲 | 舊的不碰 VM 上的客廳 | VM：客廳 `pull --ff-only` → **客廳 `mods/` 鏡像回 VM 的 `~/.claude/mods`**（`--restore-mods`）；任何一步失敗就停、不印 ✅ |
| 6 | VM：`set -e`；有沒 commit 的就停；`fetch && checkout && pull`（`&&` 裡失敗會被吞掉） | `set -eo pipefail`、一行一個指令 | 通用的比較嚴（段 6 審查 ②） | 同通用；**多一步：動任何一個專案之前，先一次查完 VM 上每個專案有沒有沒 commit 的**，有一個就整個停、VM 上一個都不動 |
| 7 | VM：`.local` `pull --ff-only` → `sync-claude --restore`（記憶、**mods ← `claude-mods/`**、開場平放那一層） | `.local` `pull` → 客廳 `autosync --restore`（記憶、開場 → `handoffs/<資料夾名>/`） | mods 不從 `.local` 還原；開場放子資料夾（05 之後 limit-guard 才讀子資料夾） | 同通用（mods 在第 5 列） |
| 8 | VM：`package-lock.json` 比 `node_modules` 新就 `npm ci` | 同（多檢查檔案在不在） | 沒差；**mods 沒有 `package.json`，不用 `npm ci`** | 同 |
| 9 | graphify-out 用 tar 搬過去，失敗只提醒 | 同（家裡沒有就不提） | 沒差 | 同 |
| 10 | ✅ 可以出門了 | 同 | — | 同 |

**回家（VM 開著，或 `--check-vm`）**

| # | 舊 | 通用（改之前） | 差在哪 | 改完 |
|---|---|---|---|---|
| 1 | 開 VM、連得上 | 同 | 沒差 | 同 |
| 2 | VM：`.local` 自動同步（舊的，含 VM 的 mods → `claude-mods/`）；回報分支、沒 commit、沒推、`.local` 沒 commit／沒推 | VM：客廳 `autosync --now`（VM 上**不備份 mods**：限 Windows）；同樣回報；VM 上沒有這個專案就跳過 | VM 的 mods 沒人帶回來 | VM：每個專案客廳 `autosync --now --no-home`（`.local` 整個）；mods 另外做一次（`--mods --now`，VM 有基準點才備份） |
| 3 | `.local` 沒推成、程式碼沒推 → 停，VM 不關 | 同 | 沒差 | 同；**多一步：VM 的 mods 跟 GitHub 上的客廳不一樣 → 停，VM 不關** |
| 4 | 關 VM（等它關好） | 同（所有專案都檢查完才關） | 沒差 | 同 |
| 5 | 家裡：`.local` `pull --ff-only` → `sync-claude --restore`（含 mods） | `.local` `pull` → `autosync --restore`（不碰 mods） | mods 沒人還原 | 同通用；最後 **客廳 `pull --ff-only` → 客廳 `mods/` 鏡像回家裡**（`--restore-mods`） |
| 6 | 家裡程式碼有沒 commit 的 → 提醒、不切分支；`fetch`、切到 VM 的分支、`pull --ff-only`（拉不下來提醒） | 同 | 沒差 | 同 |

**回家（VM 關著）**

| # | 舊 | 通用（改之前） | 差在哪 | 改完 |
|---|---|---|---|---|
| 1 | VM 關機時 `devbox-presync`：寫 `.local/tools/devbox/vm-state.txt`（到分鐘的時間、分支、沒 commit、沒推）→ 舊的 `.local` 同步（含 VM 的 mods → `claude-mods/`）、推 | `claude-home-presync` → `devbox.mjs presync`：每個專案**依序** `autosync --now`、寫 `.local/vm-state.json`（多到秒的 `at`）、commit、推；每個最多約 85 秒，`TimeoutStopSec=80` | 通用的不處理 mods；兩個專案就超過 80 秒 | **並行**：mods 備份＋檢查與每個專案的 `fetch` 同時跑 → 每個專案寫 `vm-state.json`（多一格 `mods`）→ 每個專案 `autosync --now --no-home` 同時跑。每一步限時，全部約 75 秒內；`TimeoutStopSec` 不動 |
| 2 | 家裡：`.local` `pull`、`--restore`（含 mods） | `.local` `pull`、`autosync --restore` | 同上 | 同通用 |
| 3 | 讀 `vm-state.txt`：有沒 commit／沒推的就停；**讀不到就當成沒事**、不切分支 | 讀 `vm-state.json`：比 VM 最後一次開機舊就停（段 6 審查 ③）；有沒 commit／沒推的就停；**讀不到也當成沒事**（`NaN < lastStart` 是 false） | 換手後第一次回家，上一個專案還沒有 `vm-state.json` → 不停、也不切分支 | **有 `.local`、VM 開過機、卻讀不到 `vm-state.json` → 停**，叫她 `devbox.mjs home --check-vm`（開 VM 看當下的狀態）。不讀舊的 `vm-state.txt`（那要在設定寫上一個專案的路徑） |
| 4 | 家裡程式碼：同上 | 同，但跟第 2、3 列**一個專案接著一個做**：排在後面的專案停下來時，前面的程式碼已經切過、拉過 | 舊的只有它自己；上一個專案排在 `projects` 後面時，會變成「它停下來、前面的已經動了」 | **先把每個專案的第 2、3 列做完，再動任何一個專案的程式碼**：有一個停下來，家裡的程式碼一個都不動 |
| 5 | — | — | — | 最後 mods：`vm-state.json` 寫著 VM 關機時 mods 沒推上客廳 → 家裡的 mods 不動、提醒開 VM 檢查、不印 ✅；其他照樣 `--restore-mods` |

少一步、多一步、順序不同（上一個專案改走通用流程之後）：
- **少**：`claude-mods/` 的寫入與還原（改由客廳，第 7 題：`.local/claude-mods/` 留著不動，下一輪再清）；`vm-state.txt` 不再讀。
- **多**：出門前與回家（VM 開著）時檢查 mods 推上客廳了；VM 上客廳拉不下來就停（原本只提醒）；VM 關著卻沒有 `vm-state.json` 就停。
- **順序**：舊的出門／回家只有它自己；通用的是「每個專案的家裡那一半都做完 → 開 VM → 每個專案的 VM 那一半」，上一個專案跟其他專案一起排在同一步裡。

### 做成什麼樣子

客廳（一個 commit，已推）：`tools/autosync.mjs`、`tools/devbox.mjs`、`vm/devbox.json`（私人值，照實改）、`vm/README.md`、`vm/claude-home-presync.service`（只改註解）、`vm/add-project.sh`（只改註解）、`README.md`、`docs/project-config.md`；
新測試 `tools/mods.test.mjs`、`tools/devbox-mods.test.mjs`。這個專案的 `.local` 加了 `.gitignore`（`*.log`、系統雜物；`.local` 自己的 repo，已推）。

1. **`.local` 整個同步**：`syncProject` 先照舊鏡像記憶與開場，再 `git add -A` 整個 `.local`（照 `.local/.gitignore`）。每個專案都這樣。
2. **`devbox.json` 的 `legacy` 搬進 `projects`**（排第 1 列，`vm` 是 `~/<資料夾名>`，跟它舊的 devbox.mjs 寫死的同一個）；`devbox.mjs` 的 `legacy` 分支拿掉。
   還寫著 `legacy` 的設定、空的 `projects`、哪一列的 `home` 不存在或不是 git repo → **停下來講是哪一列**（段 6 審查 ⑦ 跟著消失）。`docs/project-config.md` 的 `legacy` 那一列拿掉。
3. **mods 從客廳搬**（`autosync.mjs`，devbox 只看結果）：
   - `--restore-mods`：客廳 `pull --ff-only` → 客廳 `mods/` 鏡像到這台（`modsSkip` 同一套，`node_modules`、型別檔留著）→ 記下基準點。這台在基準點之後自己改過、還沒進客廳的 → 不蓋、exit 1。
   - `--check-mods`：`fetch` 之後拿這台的檔跟 `@{u}` 的 `mods/` 逐檔比 git 的 blob id（不動客廳的工作目錄；客廳 `.gitignore` 擋的不算）。
   - `--mods`／`--no-home`：只做 mods／只做專案。devbox 對專案一律 `--no-home`，mods 一台只做一次。
   - **基準點**：`~/.claude/mods-data/claude-home-mods-base`（這台上次跟客廳同步 mods 時客廳的 commit）。備份前 `pull`；這台的 mods 跟 `HEAD` 一樣 → 只記基準點；不一樣而且上游的 `mods/` 在基準點之後被改過（或基準點不在了）→ **不備份、只寫 log、客廳的工作目錄不動**。
     沒有基準點：Windows（家裡）照舊備份；其他（VM）不備份，等「出門」接過一次 —— 這樣 VM 上從上一個專案 `.local` 帶過去的舊 mods 不會蓋進客廳，既有測試「不是 Windows（VM）：不碰客廳」一字不改照過。
   - 出門：家裡那一半最後 `--mods --now` → `--check-mods`，不一樣就停在開 VM 之前；VM：客廳 `pull --ff-only` → `--restore-mods`，失敗就停（原本只提醒）。
   - 回家：VM 開著時每個專案檢查完 → VM `--mods --now` → `--check-mods`，不一樣就停、VM 不關；家裡最後 `--restore-mods`（失敗是提醒、不印 ✅）。VM 關著時看 `vm-state.json` 的 `mods`。
   - mods 沒有 `package.json`，不用 `npm ci`。
4. **presync 並行**（做法 5）：查了 Google 的文件，只寫「短時間」沒給秒數，所以不加 `TimeoutStopSec`，改成並行：mods 備份＋比對（≤ 40 秒）與每個專案的 `fetch`（≤ 10 秒）同時跑 →
   每個專案寫 `vm-state.json`（多一格 `mods`：`ok`／`bad`／`none`）、`autosync --now --no-home` 把整個 `.local`（含 `vm-state.json`）推上去（≤ 35 秒），同時跑。約 75 秒內。
   原本 `vm-state.json` 自己一個「VM 關機」commit，現在跟記憶一起是「自動同步」commit。VM 上沒有的專案印一行「跳過」（原本不出聲）。
5. **VM 上的步驟**（做法 6）只寫在客廳 `vm/README.md`「第 3 階段換手」：`devbox-presync` 先 drop-in 把 `ExecStop` 換成 `/bin/true`、`daemon-reload`、確認、再 `disable`；VM 的全域 hook 換成客廳的；平放的開場複製進子資料夾；客廳 pull、重裝 unit；不要對上一個專案跑 `add-project.sh`。VM 上一個都沒動。
6. 文件：客廳 `README.md`（mods 一節、新電腦第 8 步、「自動同步」整節＋基準點的表、新專案第 1 步加 `.local/.gitignore`）、`autosync.mjs`／`devbox.mjs` 開頭的說明、`vm/README.md`、unit 與 `add-project.sh` 的註解。

### 跟 issue 寫的不同的地方

1. **多停的三處**（都是「多停」，不是「少停」；主控的條件 1 要「上一個專案停下來就整個停」，原本只有它自己的 devbox.mjs 做得到）：
   - 出門：VM 那一半動任何一個專案之前，先一次查完每個專案在 VM 上有沒有沒 commit 的（原本一個一個查，排在後面的停下來時前面的已經切了分支）。
   - 回家（VM 關著）：先把每個專案的 `.local` 拉下來、看完 `vm-state.json`，**都沒問題才動任何一個專案的程式碼**（原本一個接一個，後面的停下來時前面的已經拉了）。
   - `devbox.json` 的設定檢查（上面第 2 點）。
2. **VM 關著、沒有 `vm-state.json`**：issue 舉的例子是「讀得到舊的 `vm-state.txt` 就用它」；我改成停下來叫她 `home --check-vm`。讀舊檔要在設定裡寫上一個專案的路徑（又是寫死它），而且這個情況只會在 08 之前發生（08 用「回家」關機時 presync 就會寫）。
3. **既有測試改了 `devbox.test.mjs` 9 條**（spec 原本沒列；**主控 2026-10-29 照 A**，理由與逐條寫在 spec「允許改的既有測試」）：刪 4 條只測 legacy 的、5 條只拿掉 `legacyCalls()` 那一行、設定拿掉 `legacy`。
   刪的 4 條各有一條上一個專案（`projects` 的一列 `old-proj`）當主角的新測試（`devbox-mods.test.mjs` 最後 4 條）。其他既有測試（autosync 12、devbox 剩下的 14）一字沒改。
4. `backupMods` 不再限 Windows（issue 要的），但「沒有基準點的非 Windows 不備份」—— 上面第 3 點。

### 判準

| 判準 | 結果 |
|---|---|
| 出門時客廳的 `mods/` 比 VM 上的新：VM 的 `~/.claude/mods` 會變成客廳那一份嗎？`node_modules` 會被刪嗎？ | 會變成客廳那一份；`node_modules` 留著（`devbox-mods.test.mjs` 第 1 條，VM 那一半用 bash 真的跑） |
| VM 上改過 mods、關機、回家：家裡的 `~/.claude/mods` 會變成 VM 改過的嗎？ | 會（VM 關著、`vm-state.json` 寫 `mods: ok`：「回家（VM 關著）：VM 改的 mods 已經推上客廳」）；寫 `bad` 就不接、提醒開 VM 看、不印 ✅ |
| VM 推上客廳之後、家裡還沒回家就開了對話：會把 VM 改的蓋回去嗎？ | 不會：不備份、只寫 log、客廳工作目錄乾淨（`mods.test.mjs`「基準點：…」） |
| 客廳 `pull` 失敗、鏡像失敗、mods 沒推上去：會照樣印 ✅ 嗎？ | 不會：家裡 mods 推不上去 → 停在開 VM 之前；VM 上客廳拉不下來 → 停；VM 開著回家時 VM 的推不上去 → 停、VM 不關；`--restore-mods` 拉不下來 exit 1（各有測試） |
| 上一個專案的 `.local/references/` 多一個檔：自動同步會推嗎？出門會卡住嗎？ | 會推、不會卡（`autosync.test.mjs` 新 2 條、`devbox-mods.test.mjs`「家裡的 .local 多了 references/ 的檔」）；在暫存資料夾的複本上對上一個專案試：記憶 0 個變動，`references/` 多一個檔 → 1 個會 commit |
| 走通用流程之後跟它自己的 devbox.mjs 比，少一步、多一步、順序？換手後第一次在 VM 關著時回家？ | 見上面對照表；第一次回家沒有 `vm-state.json` → 停、叫她 `--check-vm` |
| `devbox.json` 沒有 `legacy` 之後，會有專案被不聲不響跳過嗎？ | 不會：每一列都處理（兩個專案的測試）；`home` 不存在的那一列、還寫著 `legacy`、空的 `projects` 都停下來講（新測試） |
| 客廳 `autosync.mjs --restore` 會碰到 mods 嗎？ | 不會（`mods.test.mjs`「--restore 不碰 mods 與客廳」）；mods 的還原只有 `--restore-mods` |
| 主控條件 3：VM 出門接過 mods 之後才開始備份？ | 是：接之前 VM 對話結束不推、接之後記下基準點、VM 改的推上客廳（`devbox-mods.test.mjs`「VM 從客廳接過 mods（出門）之後才開始備份」） |

驗證（一支一支跑）：客廳 `node --test tools/autosync.test.mjs` 14（既有 12 一字沒改＋新 2）、`tools/mods.test.mjs` 12（新）、`tools/devbox.test.mjs` 14（既有 18 照 A 刪 4、改 5）、`tools/devbox-mods.test.mjs` 15（新）。
新測試拿改之前的 `devbox.mjs`／`autosync.mjs` 跑：mods 11／12 紅（「--restore 不碰 mods」是守住原本行為的）、devbox-mods 14／15 紅（「VM 開著回家時上一個專案有沒推的 → VM 不關」通用流程原本就做得到，守住被刪那條）、autosync 新 2 條紅。
真的這台：`autosync.mjs --check-mods` → 跟 GitHub 上的客廳一樣（基準點下一次對話開始／結束時記下）。`~/.claude/mods` 沒動，客廳 `mods/` 沒動。

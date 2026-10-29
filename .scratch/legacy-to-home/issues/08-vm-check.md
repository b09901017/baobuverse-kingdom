# 08 開 VM 走一次出門／回家

Status: done
Type: task
Blocked by: 04, 05

## 動工前先讀

- [`../spec.md`](../spec.md)「使用者選的答案」第 5、7 題
- 04、05 底下的「做完時留下的」（特別是 04 的對照表、VM 上要做的步驟）
- 客廳 `vm/README.md`、`tools/devbox.mjs`（`out`、`home`、`stop`、`status`）
- VM 上的全域 hook（`vm/README.md:66`：VM 的 `~/.claude/settings.json` 也叫上一個專案的同步）
- `docs/agents/lessons.md` 第一條：這次開 VM 是照「出門」接手的，所以關機可以按「回家」；但開之前先記下家裡每個專案的分支，關完對一次
- `.scratch/claude-home-workflow/HANDOFF.md`「要使用者做的」第 3、4 項（VM 上這個專案的 workspace trust、手機確認：**要使用者本人**，Claude 不能替使用者答）

## 使用者要的

第 5 題（最後開 VM 走一次出門／回家，會花一點錢）：「都照建議」＝**可以，開一次，用完關機**。
第 7 題：VM 上上一個專案的關機同步（`devbox-presync`）停用。

## 做法

1. 開機前：記下家裡每個專案（這個專案、上一個專案）的分支與 `git status`；確認客廳、兩個 `.local` 都推上去了。
2. 用客廳的「出門」開 VM（`node <客廳>/tools/devbox.mjs out`，或這個專案的儀表板「雲端」分頁）。
3. **在 VM 上任何對話開始之前**，做 04 寫的 VM 那一半：
   - 上一個專案的 `devbox-presync`：先用 drop-in 把 `ExecStop` 換成 `/bin/true`、`daemon-reload`，再 `disable`（只 `disable` 這次關機照樣會跑；`disable --now` 會立刻跑一次舊的同步）
   - VM 的全域 hook（VM 的 `~/.claude/settings.json`）換成客廳的同步
   - VM 上 `handoffs/` 平放的開場照 05 的做法**複製**進子資料夾
   - `claude-home-presync` 處理上一個專案、timeout 照 04 調好
4. 驗：VM 上兩個專案的分支、`.local`、記憶、開場都是家裡那一份；VM 的 `~/.claude/mods` 跟客廳 `mods/` 逐檔相同（含這一輪改過的 guard、limit-guard、dash）。
5. 在 VM 上改一個無害的 mod 檔（例如一行註解）→「回家」：家裡的 `~/.claude/mods` 有那一行、客廳有那個 commit；然後改回來、再推一次。
6. 回家之後：家裡每個專案的分支跟第 1 步記下的一樣；VM 關機（家裡的 `gcloud` 會被防毒擋，`devbox.mjs:17`：用 `devbox.mjs status` 看是不是「關著」）。
7. VM 開著的時候，請使用者做「要使用者做的」第 3、4 項（workspace trust、手機確認）。使用者這次不方便就跳過，留在清單上。

## 判準

- 出門之後，VM 上有沒有任何一個專案的資料比家裡舊（分支、記憶、開場、mods）？
- 回家之後，家裡有沒有任何一個專案被切到別的分支？
- 上一個專案的舊 presync 在 VM 關機時還會不會跑（`systemctl is-enabled`、`is-active`、drop-in 有沒有生效）？VM 的全域 hook 還會不會叫舊的同步？
- VM 最後是不是關機了？

## 規矩

開 VM 花錢：使用者已經同意開一次（第 5 題）；開之前在對話裡說一聲、用完一定關。連不上（Tailscale 沒開等）就停，寫進 HANDOFF。
不改 VM 上 fstab、不替使用者答 workspace trust、不放金鑰或 ADC 到 VM。VM 的 host、GCP 專案 id、zone 是私人值：不寫進公開 repo（commit、PR、HANDOFF 都不行）。

## 做完時留下的（2026-10-29，段 5）

開 VM 一次（12:03 開機 → 12:22 照「回家」關機），使用者已同意這一次。VM 的 host、GCP 專案 id、zone 從客廳 `vm/devbox.json` 讀，沒印出來、沒寫進這個 repo。

### 順序（跟做法寫的不同：先 `start`、換手、再 `out`）

做法 2 寫「用出門開 VM」；實際是 `devbox.mjs start` 開機 → 連進去做 `vm/README.md`「第 3 階段換手」1→4 → 再按 `devbox.mjs out`（VM 已開著，`out` 照常做家裡那一半與 VM 那一半）。
理由：`out` 開機後馬上就在 VM 上做事，VM 開機時 Remote Control 也已經先帶起 session 程序（12:03 就有兩個 `--sdk-url` 的程序，在上一個專案的資料夾）——要「VM 上任何對話開始之前」換好全域 hook，只能開機後立刻先換。
這次舊的同步一次都沒跑：上一個專案 VM 上的 `.local/tools/autosync.log` 最後一行還是 10/28 23:20（換之前、之後、使用者開手機對話之後都看過）。

### VM 上實際做的

| # | 步驟 | 結果 |
|---|---|---|
| 1 | `devbox-presync`：drop-in `/etc/systemd/system/devbox-presync.service.d/disable.conf`（`ExecStop=` 清空再 `ExecStop=/bin/true`）→ `daemon-reload` → `systemctl show -p ExecStop` 只剩 `/bin/true` → `disable`（不是 `--now`） | `is-enabled` disabled、這次開機 `is-active` 還是 active（關機時跑的是 `/bin/true`）。關機後 GitHub 上上一個專案的 `.local` 只有新 presync 的 `vm-state.json` commit，沒有舊同步的 `claude-mods/` commit |
| 2 | 全域 hook | VM 只有**一份** `settings.json`：`~/.claude-account1/settings.json`、`~/.claude-account2/settings.json` 都是連到 `~/.claude/settings.json` 的 symlink（Remote Control 用 `CLAUDE_CONFIG_DIR=~/.claude-account{1,2}`）。`SessionStart`／`SessionEnd` 換成 `"command": "node"`、`"args": ["/home/<使用者>/claude-home/tools/autosync.mjs", "--project", "${CLAUDE_PROJECT_DIR}"]`、`"timeout": 30`（跟家裡同一種寫法）；改前備份 `~/.claude/settings.json.bak-phase3-20261029`（VM 上）；其他 key 逐一比過沒動。沒被擋 |
| 3 | 平放的開場 | VM 的 `~/.claude/mods-data/handoffs/` 第一層 8 份（跟家裡同名的 8 份）`cp -p` 進 `handoffs/baobao-wellness-clinic-scheduler/`，逐檔 `cmp` 相同；md5 跟家裡子資料夾那 8 份相同。第一層的留著（06 再刪） |
| 4 | 客廳 | VM 的客廳 `d060d20` → `fe4af86`（`pull --ff-only`）；`claude-home-presync.service` 重裝、`daemon-reload`，跟客廳的檔 `cmp` 相同；enabled、active、`TimeoutStopUSec=1min 20s`。沒對上一個專案跑 `add-project.sh` |
| 5 | mods 的基準點 | `out` 的 `--restore-mods` 記下 VM 的基準點（`fe4af86`） |

### 出門之後（判準 1）

VM 開機時兩個專案都乾淨但很舊（上一個專案在 `claude/boot-card-staging-only`、`.local` 落後 14；這個專案在 `claude/claude-home-workflow`、落後 9、`.local` 落後 13）。`out` 之後：

| | 程式碼分支與 commit | `.local` HEAD | 記憶 | 開場 |
|---|---|---|---|---|
| 上一個專案 | VM＝家裡（同一個分支、同一個 commit） | 相同 | 69 份，整份 md5 相同 | 8 份，整份 md5 相同 |
| 這個專案 | VM＝家裡 | 相同 | 6 份，相同 | 4 份，相同 |

mods：VM `~/.claude/mods` 跟家裡逐檔 md5 相同（54 個檔，不算 `node_modules`、`.git`、`.claude-plugin/types`）；VM 上 `--check-mods` 跟 GitHub 上的客廳一樣。**沒有任何一個比家裡舊。**

### workspace trust、手機確認（做法 7）

使用者本人做了（Claude 沒有替使用者答）。做完之後 `rc1-`／`rc2-baobuverse-kingdom` 兩個 tmux 都是 Remote Control 等待連線的畫面；手機開的對話在 VM 上跑的是客廳的同步（VM 的基準點與客廳 `FETCH_HEAD` 在 12:19 更新），上一個專案的舊 log 一行都沒加。
提問裡寫「這個資料夾有 `.claude/settings.json` 的 hook」：那是 VM 開機時舊分支（`claude/claude-home-workflow`）的狀態，`out` 之後已切到拿掉專案 hook 的分支。

### 判準 5：VM 改 mods → 回家

VM 上在 `e2e-progress/tests/parse.test.ts` 最後加一行註解 → 按 `devbox.mjs home`（VM 開著）：VM 的 mods 推上客廳（`807bc91`，只有那一行）→ 關機 → 家裡 `--restore-mods` 之後 `~/.claude/mods` 有那一行。
家裡把那一行刪掉 → `autosync --mods --now` → 客廳 `7e375d5`（只刪那一行）；家裡那個檔跟 `fe4af86` 那一版逐位元相同，`--check-mods` 一樣。
VM 上那一行還在（VM 關著）：VM 的基準點是 `807bc91`、上游之後改過，所以 VM 下次對話結束**不會**把它推回去（基準點規則），下次「出門」時從客廳接回。

### 回家之後（判準 2～4）

- 家裡兩個專案的分支、HEAD、`worktree list`（上一個專案 10 個）跟開 VM 前記下的一樣（scratchpad 的 `before-vm.txt`，`worktree list` md5 相同）。
- `devbox.mjs status`：關著。
- 關機時的 presync：上一個專案 `vm-state.json` 推上來了（12:22:30，分支對、`dirty 0`、`ahead 0`、`mods: ok`）。**這個專案的沒推上來**（GitHub 上還是 10/28 23:20 那份）→ 段 5 中途發現 1。
- 舊的同步：`devbox-presync` 關機時跑的是 `/bin/true`（GitHub 上沒有舊同步的 commit）；VM 的全域 hook 是客廳的。
- 實際關機花幾秒（`journalctl -u claude-home-presync -b -1`）要下次開 VM 才看得到 → 留給之後（HANDOFF「要使用者做的」）。

這一段沒改任何程式（客廳、mods 的程式都沒動），沒跑測試。客廳多了兩個自動同步的 commit（`807bc91`、`7e375d5`，判準 5 的一來一回）。

# 08 開 VM 走一次出門／回家

Status: todo
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

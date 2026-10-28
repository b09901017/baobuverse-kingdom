# 13 VM 上加這個專案，並把 VM 的設定存進客廳

Status: done
Type: task
Blocked by: 06, 07, 08, 12

## 使用者要的

> 我希望這個新專案在vm中也可以有一個資料夾，這樣我在vm上可以選我要動哪個專案
> 就是我會希望能夠開啟vm後，我可以再claude 這邊一樣選擇資料夾不同repo等等

## 為什麼

VM `<VM 名字>` 上只有上一個專案。手機能選專案，靠的是每個資料夾各有 Remote Control
（上一個專案記憶：同一個資料夾一台機器只能有一個 Remote Control；帳號 1 用綁定掛載 `~/acct1/<專案>`）。
VM 上的設定（`idle-shutdown`、`devbox-rc@` 服務、`devbox-presync`）只存在 VM 上，VM 壞了就沒了。

## 做法

- 先讀上一個專案記憶 `cloud-vm-devbox-2026-10-21.md`（唯讀），照它的方式連：`ssh <VM 的 ssh host>`（Tailscale）；開機用 12 的通用版 `start`
- **先把 VM 現有的設定讀出來存進客廳 `vm/`**（腳本、systemd unit、fstab 那一行、說明），不改 VM 上的任何現有檔案
- 在 VM 上 clone 這個 repo 與 `baobuverse-kingdom-local`、客廳；加這個專案兩個帳號的 Remote Control（新的 systemd 服務，**不動** `devbox-rc@1`／`@2`），
  `--name` 用跟 `<VM 名字>` 不同、看得出是哪個專案的名字
- 帳號 1 的綁定掛載：上一個專案用 `/etc/fstab`；這次**不改 fstab**，用新的 systemd `.mount` unit
- 新資料夾的 workspace trust **要使用者本人答**（上一個專案記憶：不要替她預先寫 `hasTrustDialogAccepted`）—— 列成使用者的步驟
- VM 的全域 hook 也會在新資料夾跑上一個專案的 autosync，跟家裡電腦一樣（11 決定不分流），知道就好
- VM 記憶體 16GB，加完量一次（`free -h`），寫進 HANDOFF
- 不放任何金鑰或 ADC 到 VM（上一個專案的規矩：碰真資料的只在家裡）
- **關機前**：VM 關機時 `devbox-presync` 會在 VM 上 commit 並推上一個專案的 `.local`。如果 VM 上那份落後 GitHub，就會分岔，
  上一個專案下次「出門」的 `git pull --ff-only` 會停住。所以先讀 presync 的內容，再在 VM 上對上一個專案的 `.local` 跑 `git pull --ff-only`，然後才 `stop`
- 做完把 VM 關掉，不要開著燒錢
- 連不上（Tailscale 沒開等）就停：把卡在哪寫進 HANDOFF，交給使用者

## 判準

- 手機 Claude app 看得到這個專案的 Remote Control？（做不到實機驗證就寫「待使用者在手機確認」）
- 上一個專案在 VM 上的服務狀態與改之前一樣（`systemctl status devbox-rc@1 devbox-rc@2` 改前改後各存一次）？
- 客廳 `vm/` 只讀說明就能在新 VM 上重建？
- 結束時 VM 是關著的？關機後，上一個專案 `.local` 在 GitHub 上沒有分岔（家裡 `git -C <上一個專案>/.local fetch` 之後 `status` 不是 diverged）？

## 做完時留下的

**客廳（已推）**：`d060d20`（`vm/existing/` 從 VM 讀出來的現有設定、`vm/add-project.sh`、`devbox-rc-project`、`devbox-proj-rc@.service`、`claude-home-presync.service`；presync 每一步限時）、`2332772`＋`8c968b1`（`vm/README.md`：VM 上有什麼、新專案上 VM、在新 VM 上重建）。
**VM 上新增的**（上一個專案的檔一個沒改，`/etc/fstab` 沒改）：`~/claude-home`、`~/baobuverse-kingdom`（分支 `claude/claude-home-workflow`）與它的 `.local`（兩個 repo 都裝了推送前檢查）、
`/usr/local/bin/devbox-rc-project`、`devbox-proj-rc@1-baobuverse-kingdom`／`@2-…`、帳號 1 的 systemd `.mount`、`claude-home-presync.service`、帳號 1 路徑的記憶連到主路徑那一份。

- 開機前 VM 是關著的（沒人在用）；用客廳的通用版 `start` 開，最後用通用版 `home`（暫存設定、只有這個專案）關：VM 那一半檢查 → 關機（關機時 presync 從 VM 推了 `vm-state.json`）→ 家裡拉下來、接回記憶。
- Remote Control 的名字是 `<資料夾名>@devbox`，跟上一個專案的分開。每個 instance 用自己的 tmux server（`tmux -L rc<帳號>-<資料夾名>`）：上一個專案的 `@2` 掛在 `@1` 的 tmux server 底下（以前就這樣），新的不跟它混。
- 兩個新的 Remote Control 停在 workspace trust 的提問（「Trust …? [y/N]」），**沒有替使用者答**，列進 HANDOFF「要使用者做的」。
- **13 的「關機前對上一個專案的 `.local` 跑 `git pull --ff-only`」做不到**：VM 上那一份**早就分岔了**（10/21 起推送一直被拒，log 全是「沒推成」；fetch 後 ahead 5、behind 28，差別只有 `tools/devbox/vm-state.txt`）。
  照規矩不動它，直接關機：關機時它的 presync 照舊在 VM 上多 commit 一次、推送被拒，GitHub 不受影響。怎麼處理交給使用者（HANDOFF「要使用者決定的」）。

**判準**

- 手機 Claude app 看得到這個專案的 Remote Control？**待使用者**：要先在 VM 上答兩次 trust，再在手機確認（HANDOFF「要使用者做的」）。
- 上一個專案在 VM 上的服務狀態與改之前一樣？✓ `systemctl status devbox-rc@1 devbox-rc@2 devbox-presync idle-shutdown.timer` 改前改後各存一次（scratchpad，含 session id 所以不進 repo），去掉「幾秒前」之後逐行相同。
- 客廳 `vm/` 只讀說明就能在新 VM 上重建？✓ `vm/README.md`「在新 VM 上重建」＋`existing/` 的檔＋`add-project.sh`。沒有真的開一台新 VM 驗。
- 結束時 VM 是關著的？✓ 通用版 `status` →「關著」。關機後上一個專案 `.local` 在 GitHub 上沒有分岔？✓ 家裡 `git -C <上一個專案>/.local fetch` 之後 `## main...origin/main`。
- `free -h`（16GB）：開機後 used 991Mi；加完（兩個新的 Remote Control 在等 trust）1.1Gi。

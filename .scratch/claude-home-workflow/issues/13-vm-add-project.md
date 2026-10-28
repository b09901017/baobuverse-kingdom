# 13 VM 上加這個專案，並把 VM 的設定存進客廳

Status: todo
Type: task
Blocked by: 06, 07, 08, 12

## 使用者要的

> 我希望這個新專案在vm中也可以有一個資料夾，這樣我在vm上可以選我要動哪個專案
> 就是我會希望能夠開啟vm後，我可以再claude 這邊一樣選擇資料夾不同repo等等

## 為什麼

VM `baobao-devbox` 上只有上一個專案。手機能選專案，靠的是每個資料夾各有 Remote Control
（上一個專案記憶：同一個資料夾一台機器只能有一個 Remote Control；帳號 1 用綁定掛載 `~/acct1/<專案>`）。
VM 上的設定（`idle-shutdown`、`devbox-rc@` 服務、`devbox-presync`）只存在 VM 上，VM 壞了就沒了。

## 做法

- 先讀上一個專案記憶 `cloud-vm-devbox-2026-10-21.md`（唯讀），照它的方式連：`ssh baobao@baobao-devbox`（Tailscale）；開機用 12 的通用版 `start`
- **先把 VM 現有的設定讀出來存進客廳 `vm/`**（腳本、systemd unit、fstab 那一行、說明），不改 VM 上的任何現有檔案
- 在 VM 上 clone 這個 repo 與 `baobuverse-kingdom-local`、客廳；加這個專案兩個帳號的 Remote Control（新的 systemd 服務，**不動** `devbox-rc@1`／`@2`），
  `--name` 用跟 `baobao-devbox` 不同、看得出是哪個專案的名字
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

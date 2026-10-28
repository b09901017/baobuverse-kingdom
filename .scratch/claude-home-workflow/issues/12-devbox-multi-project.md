# 12 出門／回家改成多專案

Status: todo
Type: task
Blocked by: 06, 08

## 使用者要的

> 然後你說儀表板的「出門／回家」按鈕	按下去處理的是舊專案 ? 不能接到這個新專案嗎 ? 我希望這個新專案在vm中也可以有一個資料夾，這樣我在vm上可以選我要動哪個專案 ? 可以嗎 ?

## 為什麼

`baobao-wellness-clinic-scheduler/.local/tools/devbox/devbox.mjs` 寫死上一個專案（`REPO`、`VM_REPO`、`.local`、graphify），
`~/.claude/mods/dash` 的「雲端」分頁寫死叫那一支。VM 的背景見上一個專案記憶 `cloud-vm-devbox-2026-10-21.md`（唯讀）。

## 做法

- 客廳 `tools/devbox.mjs`：**通用版**，VM 的開關機與用量照抄邏輯但不寫死專案；相依裝在客廳自己的 `package.json`（舊版是借上一個專案的 `node_modules` 載入 `google-auth-library`）
- **VM 是共用的，出門／回家一定要涵蓋 VM 上每一個專案**：上一個專案那一份**叫它原本的 `devbox.mjs`**（一個字都不改），其他專案由通用版處理。
  例如只在新專案按「回家」卻沒檢查上一個專案在 VM 上有沒有沒推的東西，就會把它的工作留在 VM 上
- VM 的 host、GCP 專案、zone、VM 上的路徑是**私人欄位**（06 的格式），放客廳或 `.local/`，不進公開 repo
- dash：
  - 在上一個專案的資料夾、或認不出是哪個專案時 → 照舊叫上一個專案的 `devbox.mjs`（**路徑與行為不變**）
  - 在其他專案 → 叫客廳的通用版
  - 按鈕只在家裡的 Windows 電腦上畫。現在是靠「找不到 Desktop 底下的路徑」判斷自己在 VM 上，13 把客廳 clone 到 VM 之後這招就失效，要改成看平台
- 上一個專案的 `devbox.mjs` **一個字都不改**

## 判準

- 在上一個專案按「出門」，叫到的指令與以前一字不差？（用 dash 的測試證明，不要真的按）
- 在這個 repo，通用版 `status` 回得出 VM 開著或關著？
- 在 VM 上（或用測試模擬 Linux）dash 不畫出門／回家按鈕？
- 在新專案按「回家」時，上一個專案在 VM 上有沒推的東西會被擋下來（用測試證明）？
- dash 既有測試不改全過、`tsc` 0 錯？

# 12 出門／回家改成多專案

Status: done
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

## 做完時留下的

**客廳 `be89500`（已推）**：`tools/devbox.mjs`＋`tools/devbox.test.mjs`、`tools/autosync.mjs --restore`＋2 條測試、`vm/devbox.json`（私人欄位只在客廳）、`vm/README.md`、`docs/project-config.md`、`package.json`（`google-auth-library`）、dash 的複本。
**`~/.claude/mods/dash`**：`hooks/register.tsx`（只動「雲端」那一段）、`types/index.d.ts`（`offReason`、`project` 兩個欄位）、新的 `tests/vm-projects.test.tsx`。上一個專案的 `devbox.mjs` 一個字沒改。

- **出門／回家涵蓋 VM 上每一個專案**：通用版先處理清單上的專案的「家裡這一半」，再叫上一個專案**自己的** devbox.mjs（`out`／`home`，輸出直接接上），然後做其他專案的「VM 那一半」。
  任何一個停下來就整個停：出門停在開 VM 之前；回家時 VM 不關、後面的專案不動。上一個專案的 devbox.mjs 不見了也停（不跳過它）。
- **VM 關著時的回家**：上一個專案讀它自己的 `vm-state.txt`；其他專案讀 `.local/vm-state.json`，由通用版的 `presync`（VM 關機時跑，13 裝 systemd unit）寫。
- **repo → 這台**（08 留下的反方向）：`autosync.mjs --restore`，記憶與這個專案的開場；不 commit、不推、不碰 mods（mods 照舊由上一個專案 `.local` 搬）。
- **格式改了一處**：06 原本把「專案在 VM 上的資料夾」放各專案的 `.local/project.json`；因為出門／回家要逐一處理 VM 上每一個專案，清單只能有一份，改成集中在客廳 `vm/devbox.json` 的 `projects`（`docs/project-config.md` 寫了為什麼）。那個檔沒建過，沒有東西要搬。
- **dash 叫哪一支**：讀 `$.session.root()`。上一個專案的資料夾、讀不到、沒有 `.claude/project.json`、或客廳的通用版不在 → 上一個專案那一支，argv 跟以前一樣（`['node', <路徑>, <動作>]`）；其他 → `['node', ~/claude-home/tools/devbox.mjs, <動作>, '--project', <資料夾>]`，按鈕底下多一行「在 X 按的：VM 上的每一個專案都會一起處理」。
- **「在 VM 上」改成看平台**：`USERPROFILE` 有值或 `OS=Windows_NT` 才是家裡的 Windows（既有測試就是這樣假裝 Windows 的，所以不用改）；不是 Windows 就畫「這台不是家裡的 Windows 電腦」、不叫任何一支。
- **桌面 app**：dash 的 Pane 在桌面 app 也是同一份畫面；新測試用 `surface: 'desktop'` 掛起來，按鈕、那一行說明、跑完的「回家：好了」都在。

**判準**

- 在上一個專案按「出門」，叫到的指令與以前一字不差？✓ `vm-projects.test.tsx`：session 在上一個專案的資料夾，**就算客廳的通用版與 `.claude/project.json` 都在**，`status` 是 `['node', <上一個專案>/.local/tools/devbox/devbox.mjs, 'status']`、出門是 `[..., 'out']`，逐字比對。認不出的資料夾、客廳還沒 clone 的新專案也一樣。
- 在這個 repo，通用版 `status` 回得出 VM 開著或關著？✓ 用家裡的 ADC 跑 `node ~/claude-home/tools/devbox.mjs status` →「關著」；`usage` 也回得出這個月的時數與台幣。
- 在 VM 上（或用測試模擬 Linux）dash 不畫出門／回家按鈕？✓ 新測試：只有 `HOME=/home/...`、客廳與兩支 devbox.mjs 都「在」→ 沒有按鈕、沒叫任何一支。
- 在新專案按「回家」時，上一個專案在 VM 上有沒推的東西會被擋下來？✓ `devbox.test.mjs`（11 條）：VM 關著／開著兩種，上一個專案的 devbox.mjs 回 exit 1 → 通用版 exit 1、印它的「✋」、這個專案不動、VM 不關；反過來這個專案在 VM 上有沒推的 → 停在叫上一個專案之前。
- dash 既有測試不改全過、`tsc` 0 錯？✓ 既有 11 條（三個檔與動工前逐位元組相同）＋新 5 條＝16 條全過；`tsc` 0 錯；`claude plugin validate` 過（只有「別的 plugin 的 state 沒檢查」的警告，跟以前一樣）。其他四支 mod 照跑：e2e-progress 5、guard 19、limit-guard 24、notify 3 全過。客廳 `autosync.test.mjs` 12 條全過。

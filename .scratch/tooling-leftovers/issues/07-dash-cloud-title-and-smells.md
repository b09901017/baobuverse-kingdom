# 07 儀表板：「雲端」分頁標題讀設定、J7、J4

Status: done（客廳 `3d925e7`；「雲端」分頁 10/29 截圖過了：標題是 VM 的名字、狀態與按鈕照常、「在 baobuverse-kingdom 按的」）
Blocked by: 05（J5 與這支的 J4 都在 limit-guard 加測試，要依序；05 先）
動工前先讀：`.scratch/legacy-to-home/HANDOFF.md`「中途發現」段 6 第 1 條、「判斷題」J4、J7；這份 HANDOFF「過目抓到的」07；
客廳 `mods/dash/hooks/register.tsx`（標題 `:1998`、註解 `:1842`、`devboxScript` `:1866,1885,1948`、`Devbox.project` `:1854`、`DashVm.project` `:1890`、退路路徑 `:1981`、`devboxPath` `:1862-1864`、以 email 去重 `:363-371,449-452,1736`）、
`mods/dash/types/index.d.ts:82`、limit-guard `hooks/accounts.ts:22-38`、客廳 `vm/devbox-rc-project:18`、`vm/existing/devbox-rc:11`

## 使用者要的

> 下一輪，候選清單就一起做吧，全部完成

## 要做的

| 來源 | 改什麼 |
|---|---|
| 段 6 中途發現 1 | 「雲端」分頁的標題寫死 VM 的 instance 名（**私人值**，跟 GCP 專案 id 同一個字）。改成讀客廳 `vm/devbox.json` 的 `instance`；讀不到、沒有或不是字串時顯示通用字（例如「雲端 VM」）。`:1842`、`index.d.ts:82` 的註解與 `vm/devbox-rc-project:18` 的註解一起拿掉 |
| J7 | `devboxScript` 回 `{script, project}` 卻放進叫 `script` 的變數；`Devbox.project` 是路徑、`DashVm.project` 是資料夾名；寫死的退路路徑跟 `devboxPath` 重複 → 改名、退路只留一處。順便看 `DashVm.project` 在 worktree 開的對話是不是寫 worktree 名（06 的連動），要改就照主資料夾名 |
| J4 | limit-guard `accounts.ts` 與 dash 各一套 `desktopEmail`、`emailOf`、以 email 去重（不能互相 import；dash 那套吃 `$`）→ 兩個 mod **各一條測試**，用同一份假資料、同一個期待值；加一條 tools 的 node 測試確認兩份假資料逐字相同。
  兩邊輸出形狀不同（limit-guard 回「其他帳號」、排除目前帳號與 `switchable:false`；dash 回全部），先定好投影成同一種形狀再比 |

## 判準

- **dash 與 `tools/` 的程式碼、測試裡還有沒有 instance 名？**（要：0 筆。比對用 spawnSync 讀 `devbox.json` 的值、只印筆數，不要把值放進指令字串或印出來）
  `vm/existing/devbox-rc:11` 是 VM 上上一個專案 Remote Control 的名字（手機上看到的），**這支不改**，寫進 12 讓那一段決定。
- `devbox.json` 讀不到、沒有 `instance` 或不是字串時，分頁會不會壞掉或空白？（要：通用字）
- 畫面上的字會變：改完停下來回報「要截圖看哪一頁」（「雲端」分頁），主控請使用者在新對話點、截圖。截圖過了才算 done
- dash 既有測試一條都不改就全過，tsc 0 錯、validate 過；改完複製進客廳 `mods/`，兩份逐檔相同

## 做完時留下的（段 4，客廳 `3d925e7`）

- **標題**：`vmRefresh` 找到 devbox.mjs 之後讀客廳 `vm/devbox.json`（`vmName`），`instance` 是不空的字串就當標題，其他（沒有檔、沒有 `instance`、不是字串、空白、不是 JSON、`null`）寫「雲端 VM」，分頁照常畫。註解（`register.tsx` 那一節的標題、`types/index.d.ts` 的 `DashVm`）與客廳 `vm/devbox-rc-project:18` 的註解拿掉名字（改成「上一個專案的 Remote Control」）。
  判準 1：dash（家裡與客廳兩份）、客廳 `tools/`、limit-guard 用 spawnSync 讀 `devbox.json` 的值比，**0 筆**；客廳 `vm/` 只剩 `vm/existing/devbox-rc:11`（照這支的範圍不改，12 決定）。
- **J7**：`Devbox` → `DevboxCall`（`{ script, root }`：`root` 是這個對話的資料夾路徑，帶 `--project`）、`devboxScript` → `devboxCall`、變數 `script` → `call`；`DashVm.project` 留著（資料夾名，型別註解寫清楚）。
  客廳的位置只算一處：`homeRepo($)`＋`DEVBOX_MJS`；找不到 devbox.mjs 時 `vmRefresh` 把兩個路徑一起放進 state，畫面不再有寫死的退路路徑與 regex。
  `DashVm` 的 `available`／`offReason`／`missing` 收成一格 `off`（`{reason:'not-windows'}`、`{reason:'no-devbox', script, repo}`、`null`），多一格 `name`。別的 mod 不讀 dash 的 vm state（grep 過）。
- **J7 worktree**：「在 X 按的」原本在 worktree 開的對話寫 worktree 名。改成問引擎的 `$.session.repo()`（文件：「the main working tree's for a worktree」），有 `root` 就用它的資料夾名，沒有（不在 repo、問不到）用這個對話的資料夾名。
  **跟 issue 寫的不同**：沒有照 limit-guard `worktreeOf` 讀 `.git`、也沒用 `worktree-cases.ts`——mod 測試引擎不載入 mod 資料夾外的檔（段 4 實測：`cannot import … it is outside the plugin's folder`），而引擎自己就認得主資料夾，不用寫第三份認法。`--project` 照舊帶 worktree 的路徑（devbox.mjs 06 之後自己認主資料夾）。
- **J4**：同一份案例 `tests/fixtures/account-cases.ts`（9 種：VS Code 三個資料夾、桌面 app 兩種、email 大小寫、沒登入的資料夾、`switchable:false`、同一個 email 一個能切一個不能切、這個對話的資料夾不在 `accounts.json`）兩個 mod **各放一份**（不能跨 mod import），客廳 `tools/shared-fixtures.test.mjs`（新的，1 條）守兩份逐字相同、並 import 確認有案例。
  投影：「目前帳號以外、能切過去的帳號」，登入的寫 email（小寫）、沒登入的寫 label，照 `accounts.json` 的順序；limit-guard 是 `otherAccounts` 的 label，儀表板是帳號頁的卡拿掉 ● 那張。兩邊現在的程式都過（沒有不一致）；把儀表板分組的 `toLowerCase` 拿掉試過，大小寫那條會紅。
- 紅燈：標題 7 條、worktree 1 條先紅（「不在 repo」那條改之前就過，守門）；J4 是釘住現在的行為，本來就綠。shared-fixtures 在複製案例進客廳之前紅（ENOENT）。
- 測試：dash 38 → 56（`vm-title` 9、`same-accounts` 9）、limit-guard 58 → 67（`same-accounts` 9）、客廳 `tools/shared-fixtures.test.mjs` 1；既有測試一條沒改。tsc 兩個 mod 0 錯、validate 過（那一個 warning 改之前就有）；`~/.claude/mods` 與客廳 `mods/` 逐檔相同。
- 段 4 的對話裡印出過一次 instance 名（動工時 grep 註解，在改 `count-instance` 之前）：只在對話裡，沒有進任何 repo 或檔案。

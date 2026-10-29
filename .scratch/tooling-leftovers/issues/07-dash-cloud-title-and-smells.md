# 07 儀表板：「雲端」分頁標題讀設定、J7、J4

Status: todo
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

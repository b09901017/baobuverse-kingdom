# 11 全域的 autosync hook 依資料夾分流

Status: wontfix
Type: task

## 原本想做的

全域 SessionStart／SessionEnd 只在上一個專案的資料夾跑它的 `autosync.mjs`，其他資料夾不跑。

## 為什麼不做（2026-10-28 過目時發現）

上一個專案的「回家」（`.local/tools/devbox/devbox.mjs` 的 `home()` → `pullLocal()`）會跑 `sync-claude.mjs --restore`，
把舊 `.local` 裡的 `claude-mods/` **鏡像**回 `~/.claude/mods`（來源沒有的檔會刪掉）。
分流之後，在別的專案改的 mods 不會再備份進舊 `.local`，某些情況下（例如從手機直接開 VM、沒按「出門」）按「回家」會把改過的 mods 蓋回舊版。

而 10 做完之後，舊的 autosync 已經不會帶走這個專案的任何資料，分流換來的只剩「少推幾次舊 repo」，不值得冒險。
`index.lock` 撞在一起是上一個專案自己的事，等第 3 階段（上一個專案搬家）再處理。

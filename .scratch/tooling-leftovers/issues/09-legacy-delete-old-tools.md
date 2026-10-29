# 09 刪上一個專案 `.local/tools/` 的舊同步工具與 `.local/claude-mods/`（`pre-push` 留著）

Status: todo
Blocked by: 無
動工前先讀：`.scratch/legacy-to-home/spec.md`「使用者選的答案」第 7 題、「之後的樣子」；`.scratch/legacy-to-home/HANDOFF.md`「段 7 審查結果」第 2 條（段 8 在記憶與 `.local/README.md` 加的「不要再叫」）；這份 HANDOFF「過目抓到的」09；
上一個專案 `.local/README.md`（只看 `tools/` 與 `pre-push` 那幾行，`:79`、`:101`）；客廳 `README.md:39`、`vm/existing/devbox-presync*`

## 使用者要的

> 下一輪，候選清單就一起做吧，全部完成

上一輪第 7 題：`.local/tools/` 的舊同步工具「這一輪不改、不刪，只是不再叫它」，`.local/claude-mods/` 下一輪再清。

## 為什麼會這樣

第 3 階段換成客廳的工具之後，舊的同步工具與 `claude-mods/` 只剩「照文件叫」一條路，叫了會把舊 mods 蓋回來（段 7 第 2 條）。
上一個專案的 `.local` 是私人 repo（有版控，刪了救得回來），客廳的自動同步會推上去。

**`.local/tools/pre-push` 不是舊同步工具**：它是那個私人 repo 的推送關卡（推之前查 GitHub 上是不是 PRIVATE，不是就拒絕；那個 repo 裡有客戶的真名與健康資訊），
`.local/README.md:79,101` 寫每一台電腦要 `cp tools/pre-push .git/hooks/pre-push`。整個 `tools/` 刪掉，新電腦或 VM 重 clone 就裝不到關卡。

## 要刪的（逐檔）

`.local/tools/autosync.mjs`、`.local/tools/sync-claude.mjs`、`.local/tools/devbox/`（裡面的每一個檔先列出來）、`.local/tools/autosync.log`（有追蹤才刪）、`.local/claude-mods/`。**`.local/tools/pre-push` 留著。**

## 判準

- 刪之前 grep：家裡與客廳有沒有任何東西還叫這些路徑（儀表板、mods、客廳 tools、全域與三份帳號資料夾的 `settings.json`、Windows 排程、上一個專案追蹤的檔）？（要：0 筆；註解與測試假資料（例如 `vm-projects.test.tsx:9,123`）不算，列出來）
- `pre-push` 還在、內容沒變；`.local/README.md` 的裝法照舊對得上
- 段 8 加的「不要再叫」那幾句（兩份記憶、`MEMORY.md` 兩行、`.local/README.md` 三段）改成「已刪（日期、commit）」，不留指向不存在的路徑的說明；客廳 `README.md:39`（「`.local/claude-mods/` 不再更新（留著不動，下一輪再清）」）一起改
- 客廳 `vm/existing/devbox-presync*` 與 `vm/README.md` 對應的地方：寫進 12（VM 上的 unit 收掉之後再一起拿掉）
- `.local/references/` 不讀、不動；查記憶只用 `grep -l`、挑沒有私人值的行
- 刪完上一個專案的工作目錄、分支、worktree 不變；它的 `.local` 推上去了（被擋就停、寫進 HANDOFF）

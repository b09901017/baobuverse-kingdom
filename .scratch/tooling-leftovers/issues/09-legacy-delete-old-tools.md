# 09 刪上一個專案 `.local/tools/` 的舊同步工具與 `.local/claude-mods/`（`pre-push` 留著）

Status: done
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

## 做完時留下的（段 6，2026-10-29）

- 使用者 10/29 刪之前點頭：「照建議刪」。
- 刪了 59 個有追蹤的檔：`tools/autosync.mjs`、`tools/sync-claude.mjs`、`tools/devbox/`（`devbox.mjs`、`prices.json`、`vm-state.txt`）、`claude-mods/`（dash 13、e2e-progress 8、guard 13、limit-guard 14、notify 6）。
  `tools/autosync.log` 被 `.local/.gitignore` 的 `*.log` 擋著、**沒追蹤 → 照 issue 留著**（舊工具的 log，10/29 11:10 之後沒再寫）。`tools/` 現在只剩 `pre-push` 與那份 log。
- `pre-push` 的 blob 前後同一個（`git hash-object` 一樣）；`.local/README.md` 換電腦第 3 步 `cp tools/pre-push …` 照舊對得上。
- 刪之前 grep（0 筆會叫到的）：全域與兩個帳號資料夾的 `settings.json`（hook 都是客廳的 autosync；還有一份 10/16 的備份資料夾，也是 0）、Windows 排程 193 個 0 筆、上一個專案追蹤的檔 0 筆。
  剩下提到的都不是呼叫：dash `register.tsx:1845` 註解、`vm-projects.test.tsx:9,123` 測試假資料、客廳 `settings/README.md:8` 與 `vm/README.md:57` 寫歷史、客廳 `vm/existing/devbox-presync`（VM 上已停用，12 收）。
- 改成「已刪」：兩份記憶（`private-local-repo.md` 的 description、開頭、`claude-memory/` 那句、log 位置；`cloud-vm-devbox-2026-10-21.md` 開頭與「出門／回家」那行）、`MEMORY.md` 兩行、
  `.local/README.md`（D 段 `claude-mods/` 與 `sync-claude` 兩行、「自動更新」、手動更新換成客廳 `autosync.mjs --strict --no-mods`、換電腦第 4 步改成客廳的 `--restore-mods`／`--restore`）、`.local/知識庫/00-先讀這個.md` 的 `claude-mods/` 那列（issue 沒列到，grep 找到的）、客廳 `README.md:39`（客廳 `24d8413`）。
- `.local` 用客廳的 `autosync.mjs --project <上一個專案> --strict --no-mods` 推上去（exit 0，`.local` `dca9cd8`，64 個檔：59 刪＋README＋知識庫＋記憶 3 份的鏡像），沒被擋。
- 上一個專案的工作目錄前後相同：`claude/availability-sheet-chart-no`、`5b785ad8`、worktree list 10 行。
- 客廳 `vm/existing/devbox-presync*` 與 `vm/README.md` 對應的地方照 issue 12 第 4 步收（沒動）。

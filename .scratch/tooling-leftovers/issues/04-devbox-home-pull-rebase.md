# 04 devbox 回家：家裡那一半的 `.local` 改用 03 的嚴格模式接起來

Status: todo
Blocked by: 03
動工前先讀：`.scratch/legacy-to-home/HANDOFF.md`「中途發現」段 9 第 1 條；這份 HANDOFF「過目抓到的」04；客廳 `tools/devbox.mjs` 的 `pullLocal`（`:158-167`，`pull --ff-only` 之後 `--restore`）與 `out` 的 VM 那一半（`:284`）

## 使用者要的

> 下一輪，候選清單就一起做吧，全部完成

## 為什麼會這樣

段 9 只改了「出門」VM 那一半的 `.local`。回家的家裡那一半 `pullLocal` 還是 `pull --ff-only`：家裡有沒推的 commit、VM 也推了新的時，回家停在「家裡電腦的 X/.local 拉不下來」。
`pullLocal` 也沒拿 autosync 的鎖，跟同時在跑的對話結束同步會撞 `index.lock`。

## 做法

回家的家裡那一半**直接叫 03 的 autosync 嚴格模式**（在鎖裡 commit → `pull --rebase` → 推；接不起來就 abort、exit 1），成功才 `--restore`。devbox 不另寫一份 rebase，也不用 `--autostash`
（autostash 套回時衝突，新版 git 會把改動存進 stash、exit 0，接著 `--restore` 的 `mirror` 會把剛寫的記憶從記憶資料夾刪掉）。

## 判準

- 家裡 `.local` 一個沒推的 commit、遠端另一個 commit（不同檔）→ 回家會不會停？（要：接起來、照常回家）
- 兩邊改了同一個檔 → 會不會留下 rebase 做一半、或照樣跑 `--restore`？（要：abort、停、**不跑 `--restore`**，訊息說是哪個專案）
- 家裡 `.local` 有沒 commit 的檔、遠端也改了同一個檔 → 會不會弄丟？（要：停、不跑 `--restore`、檔還在）
- 紅燈：暫存 bare repo 兩個 clone；既有測試一條都不改

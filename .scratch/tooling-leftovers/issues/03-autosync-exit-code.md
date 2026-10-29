# 03 autosync：嚴格模式（沒推成就 exit 1），devbox 家裡那兩份只看 exit code（J1）

Status: todo
Blocked by: 無
動工前先讀：`.scratch/legacy-to-home/HANDOFF.md`「判斷題」J1、「中途發現」段 5 第 1 條（段 9 修的 `7345fbf`）；這份 HANDOFF「過目抓到的」03；
客廳 `tools/autosync.mjs`（`:34-57` 旗標與背景、`commitAndPush` `:146-195`、`syncProject`／`withLock` `:239-250`、`:449-460` 吞錯與 `process.exit(0)`）、`tools/devbox.mjs`（`pushLocal` `:155-156`、`vmState` `:191-198`、`checkVmState` `:203`、`presync` `:425`）、`tools/devbox.test.mjs:149`

## 使用者要的

> 下一輪，候選清單就一起做吧，全部完成

## 為什麼會這樣

`commitAndPush` 推不上去只寫 log，`:449-460` 把每一步的錯吞掉、最後一律 `process.exit(0)`。所以 devbox 叫完 autosync 要自己再查 git（家裡 `:155`、presync `:425` 兩份）。段 9 照 J1 沒加第三套。

## 做法

autosync 加一個嚴格模式（旗標名段裡定）：**一定在前景跑**（加進 `:50` 不開背景的清單）；下面任何一種都 exit 1、訊息說是哪個專案哪一步：
推被拒或推失敗、拿不到鎖（比照 `--restore-mods` 等約 30 秒再放棄）、`git add`／`commit` 出錯、`memoryDir`／`mirror` 出錯。
mods 那一半（`backupMods` 因基準點不備份是正常）**不在嚴格模式的範圍**，照舊。
devbox 只拿掉**家裡**（`:155`）與 **presync**（`:425`）兩份「推完了沒」，改看 exit code。**VM 那一半的 `vmState`／`checkVmState` 不動**：「回家（VM 開著）」不會先更新 VM 的客廳，家裡新版叫到 VM 舊版 autosync 時新旗標會被忽略。

## 判準

- 紅燈（暫存 bare repo，不碰真的 `.local`）：推被拒、拿不到鎖、commit 出錯 → 嚴格模式 exit 1；不帶模式 → exit 0、只寫 log（對話開始／結束的 hook 照舊不受影響）
- 只帶嚴格模式、沒帶 `--now` 時會不會跑到背景、馬上 exit 0？（要：不會，一條測試）
- 「出門」「回家」在 `.local` 沒推上去時，停下來的訊息跟現在一樣清楚？
- 既有 `devbox.test.mjs` 14、`devbox-mods.test.mjs` 22、`autosync.test.mjs` 19、`mods.test.mjs` 13 一條都不改就全過；要改的先停、問主控

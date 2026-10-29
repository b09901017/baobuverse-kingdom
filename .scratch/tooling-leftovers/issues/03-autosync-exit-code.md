# 03 autosync：嚴格模式（沒推成就 exit 1），devbox 家裡那兩份只看 exit code（J1）

Status: done
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

## 做完時留下的（段 2，客廳 `b5631ea`）

- 旗標名 **`--strict`**。一定在前景跑（加進不開背景的清單）；別的同步拿著 `.local` 的鎖就等，最多 30 秒（`LOCK_WAIT`，跟 `--restore-mods` 共用；測試用 `AUTOSYNC_LOCK_WAIT_MS` 換短）。
- 沒做成就 exit 1，stderr 印一行「`<專案>/.local：<哪一步>：<原因>`」。步驟：拿不到鎖（「別的同步正在跑，等了 30 秒還沒好」）、`記憶複製進 .local`、`開場複製進 .local`、`git add`、`git commit`、`拉不下來`、`沒推成`。
  兩台改了同一個檔：`沒推成：pull --rebase 沒成功：兩台改了同一個檔（notes.md），回到拉之前`（`pullRebase` 在 abort 之前用 `git diff --diff-filter=U` 記下檔名；git 把 CONFLICT 印在 stdout，stderr 只有「Could not apply…」）。
- **跟 issue 寫的不同**：嚴格模式**沒有要推的也拉**（`pull --rebase`）。issue 04 要「回家的家裡那一半直接叫嚴格模式」，原本的 `commitAndPush` 沒有要推的就不拉，回家會接不到 VM 推的；所以「接起來」放進嚴格模式的定義，03 一起做、一起測（`嚴格模式：這台沒有要推的、另一台推了新的 → 拉下來`）。
- `errText` 改成取 git 最後一行 `fatal:`／`error:`（推被拒時最後一行是 `hint:`、remote 不存在時是「and the repository exists.」），沒有才取最後一行；上限 200 → 300 字（外面還要包一層「專案：步驟：」）。
  不帶 `--strict` 的 log 也跟著變：多了哪個專案哪一步，推不上去的那行改成「沒推成：pull --rebase 沒成功：…」（拉的原因在前；以前是推的原因＋括號裡拉的原因）。exit code 照舊 0。
- devbox：`pushLocal`、`presync` 拿掉自己再查一次的「`.local` 推完了沒」，改看 exit code；停下來的訊息直接帶 autosync 說的原因（以前是「看客廳 tools/autosync.log 最後幾行」）。VM 那一半的 `vmState`／`checkVmState` 沒動。`pullLocal` 留給 04。
- presync 每個專案的 `.local` 限時 35 秒沒改；嚴格模式拿不到鎖會等最多 30 秒，等的這段算在 35 秒裡。以前拿不到鎖直接跳過（算沒推成），現在別的同步在 25 秒內做完就推得成；等太久被殺掉跟以前一樣算沒推成。
- 測試：autosync 新 12 條（19 → 31）：前景、推不上去、兩台改同一個檔（已 commit）、沒 commit 的檔＋遠端改同一個檔、`git add` 出錯（`index.lock` 在）、`git commit` 出錯（pre-commit hook 擋）、記憶 `mirror` 出錯（`.local/claude-memory` 是檔案）、拿不到鎖、鎖幾秒後放開、沒有要推的也拉、mods 那一半沒做成不算、不帶 `--strict` 照舊 exit 0（log 帶步驟）；先跑過全紅（`--strict` 不認得 → 背景 → exit 0）。
  devbox-mods 新 3 條（22 → 25）：出門時 `.local` 推不上去（訊息帶原因）、出門時鎖幾秒後放開（以前跳過 → 停）、presync 推不上去（那一行帶原因、其他專案照推）；先紅。既有四支一字不改（只在檔尾加），devbox 14、mods 13 照過。
- 測試裡「幾秒後放開鎖」用 `execFileSync` 開一個 `node -e` 再 `spawn` 一個不等它的程序：測試檔只 import 了 `execFileSync`，改 import 那一行算改既有測試（spec「允許改的既有測試」只准 05），所以不動它。05 J8 抽小工具時可以一起收。

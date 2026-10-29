# 12 開一次 VM：PR #6 的 5 項、走一次出門／回家、VM 上的舊東西收掉

Status: todo
Blocked by: 03、04、05、06、09（同步的程式與上一個專案 `.local` 都改好、推上去，VM 才拉得到）
動工前先讀：這份 spec「使用者選的答案」第 1 題；PR #6 內文「手動檢查清單」；`.scratch/legacy-to-home/HANDOFF.md`「中途發現」段 3 第 3 條、段 5 第 1、3、4 條、「要使用者做的」下次開 VM 那幾條；
`.scratch/legacy-to-home/issues/08-*.md`（上次開 VM 的做法與「做完時留下的」）；客廳 `vm/README.md`、`vm/existing/`；這份 HANDOFF「過目抓到的」12；09、07 寫給這支的事

## 使用者要的

> 下次開 VM 時順便做 : 你沒幫我測試過嗎 ?

答案：**開一次（建議）**——這一輪最後、同步那幾支改完之後；做 5 項、真的走一次出門／回家，用完關機。開機前主控再提醒一次。

## 要做的（照這個順序）

1. 開機前：段在對話裡跟使用者說「要開 VM、會花錢、用完關機」。「出門」要家裡每個專案乾淨、已推：這個 repo 先 commit、推（`.scratch` 的改動也算），上一個專案確認乾淨。
   「回家」會對上一個專案 `checkout`＋`pull --ff-only`，這是既有的流程，預期中的（寫進「做完時留下的」）。
2. 用儀表板／`devbox.mjs` 的「出門」開 VM。**VM 一開機，Remote Control 的對話會跑對話開始的 autosync**（VM 上還沒 pull 的舊版客廳），可能跟「出門」的 `.local pull --rebase` 撞 `index.lock`：
   先等開機時的 hook 跑完（看 VM 上的 autosync log）再讓「出門」那一步動 `.local`；撞到了照訊息重來，不要當成程式錯。
3. PR #6 的 5 項：
   - 先 `journalctl --list-boots`（只有一筆就是 journal 沒持久化、看不到上一次開機，照實記）→ `journalctl -u claude-home-presync -b -1`：10/29 那次關機 presync 跑了幾秒（要在 `TimeoutStopSec=80` 內）、兩個專案各寫了什麼
   - 這個專案 VM 上的 `.local`：`git status`、`git log @{u}..HEAD`；10/29 沒推上去的 `vm-state.json` 有沒有在出門時接上、推上去
   - VM 上 `~/.claude/mods-data/handoffs/` 第一層 8 份平放的開場刪掉（子資料夾有一樣的，刪前逐檔 `cmp`）
   - 出門之後 VM 上 `node ~/claude-home/tools/autosync.mjs --check-mods` 看一次（判準 5 留下的那行註解應該已經換成客廳那一份）
   - 預期中的：出門之前 VM 關著按「回家」會停、叫 `--check-vm`（只確認說明對，不用特地重現）
4. VM 上舊的東西：上一個專案已停用的 `devbox-presync`（09 刪了它指的舊工具）收掉：刪 `/usr/local/bin/devbox-presync`、unit 與 drop-in、`systemctl daemon-reload`；
   之後客廳 `vm/existing/devbox-presync*` 與 `vm/README.md` 對應的地方一起拿掉。確認 VM 的客廳在出門時 pull 到含 05 改名的 commit（unit 不用換：`vm/` 底下沒有用 `--no-home` 的）。
   `vm/existing/devbox-rc:11` 的 Remote Control 名字（私人值，手機上看到的）要不要改：改了要重裝、手機上的名字會變 → 在段的對話問使用者，建議**不改**。
5. 用「回家」關機。確認 VM 關了（`devbox.mjs status`）、家裡兩個專案的分支沒變、`.local` 跟 GitHub 一致。

## 判準

- 每一項的結果（時間、commit、檔數）記進 issue 底下「做完時留下的」；要使用者本人做的（workspace trust 之類）在段的對話裡直接請使用者做
- VM 只開這一次；任何一步停住：先回家關機，再回報，不要讓 VM 開著等
- VM 的 host、GCP 專案 id、zone、instance 名不寫進這個 repo 的任何檔、commit、PR

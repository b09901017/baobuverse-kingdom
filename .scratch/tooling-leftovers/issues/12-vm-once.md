# 12 開一次 VM：PR #6 的 5 項、走一次出門／回家、VM 上的舊東西收掉

Status: done
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

## 做完時留下的（2026-10-29，段 7）

開 VM 一次：21:28 開機 → 21:33 照「回家」關機（約 5 分鐘），使用者在段 7 對話點頭（「開，照做（建議）」）。`devbox.mjs status`：**關著**。
私人值從客廳 `vm/devbox.json` 讀、輸出裡換成 `<…>`（scratchpad 的 `vm.mjs`），沒寫進這個 repo。

先修了段 2 中途發現 1（客廳 `62adaf0`：出門的 VM 那一半 `.local` 改叫 `autosync --strict --no-mods`），這次出門用的就是新的。

### 順序（跟「要做的」第 2 步不同：先 `start`、看開機的同步、再 `out`）

`devbox.mjs start` → 連進去看：開機 0 分鐘、沒有 autosync 程序，客廳 log 21:29 有 Remote Control 對話開始的同步（VM 上舊版客廳 `807bc91`）跑完了 → `devbox.mjs out`（VM 已開著，照常做家裡那一半與 VM 那一半）。沒撞到 `index.lock`。
理由：`out` 開機後馬上動 VM 的客廳與 `.local`，開機時的同步也在動；先開機、確認它跑完再出門最穩（`--strict` 也會等鎖最多 30 秒）。

### PR #6 的 5 項

| # | 項目 | 結果 |
|---|---|---|
| 1 | journal 與上次關機的 presync | journal **有持久化**：`--list-boots` 5 筆（10/22、10/28 兩次、10/29 12:03、這次）。`journalctl -u claude-home-presync -b -1`（要 `sudo`：VM 的使用者不在 `adm`／`systemd-journal`，不加只看得到 node 印的行）：12:22:26.86 Stopping → 12:22:33.02 Stopped，**約 6.2 秒**（`TimeoutStopSec=80` 內）、CPU 2.9 秒。寫了：mods「推上客廳了」；上一個專案 `vm-state.json`（分支對、dirty 0、ahead 0、mods ok）；這個專案「沒推成：.local 沒推上去」（＝段 5 中途發現 1） |
| 2 | 這個專案 VM 上的 `.local` | 開機時 ahead 1（`b8db715`，12:22 的 `vm-state.json`）、behind 22、乾淨；開機時的同步（舊版客廳）又推一次、照樣「沒推成」（non-fast-forward）。`out` 的 `--strict` 把它接在家裡推的後面、推上去（`cb13a40`），之後 ahead 0、behind 0、乾淨 |
| 3 | handoffs 第一層 8 份平放的開場 | 8 份逐檔 `cmp` 跟 `handoffs/baobao-wellness-clinic-scheduler/` 那份相同 → 刪了 8 份，第一層剩 0 個檔、子資料夾 8 份 |
| 4 | 出門之後 `--check-mods` | 「mods：跟 GitHub 上的客廳一樣（`62adaf0`）」，exit 0（判準 5 那行註解已經是客廳那一份） |
| 5 | VM 關著按「回家」會停、叫 `--check-vm` | 照說明，沒特地重現（`vm/README.md:19-22` 與程式一致） |

出門的輸出：上一個專案記憶 69 份、開場 8 份、graphify 80M；這個專案記憶 6 份、開場 7 份；mods 68 個檔；兩個專案都切到家裡的分支與 commit。套件沒變，沒跑 `npm ci`。

### VM 上舊的東西（第 4 步）

- `devbox-presync`：開機時 disabled、inactive、`ExecStop` 只剩 `/bin/true`（drop-in）、`*.wants/` 沒有它。VM 上兩個檔的 md5 跟客廳 `vm/existing/` 的複本相同 → 刪了 `/usr/local/bin/devbox-presync`、`devbox-presync.service`、drop-in `disable.conf`（＋空的 `.service.d` 資料夾）、`daemon-reload` → `LoadState=not-found`。`claude-home-presync` 照舊 enabled、active。
- 客廳 `1abf957`：`vm/existing/devbox-presync*` 兩個檔拿掉（git 歷史有）、`vm/README.md`（「VM 上有什麼」那一列、「第 3 階段換手」第 1 步改成收掉的步驟、平放開場那句改成刪了）、`vm/add-project.sh` 註解。`vm/existing/idle-shutdown:12` 的註解還提到 `devbox-presync`：那是 VM 上那份的原樣，不改（README 寫了一句）。`vm/claude-home-presync.service:11` 的註解（「停用」）沒改：改了 VM 上裝的那份就跟客廳不同，要重裝。
- VM 的客廳在出門時 pull 到 `62adaf0`（含 05 改名的 `baebee3`）；unit 沒換。
- `vm/existing/devbox-rc:11` 的 Remote Control 名字：使用者「不改（建議）」。

### 回家（第 5 步）

`devbox.mjs home`：VM 上兩個專案都推上去了、mods 跟客廳一樣 → 關機 → 家裡接 `.local`、記憶（69、6 份）、開場（8、7 份）、mods（客廳 `1abf957`，68 個檔）→ ✅。
- `devbox.mjs status`：關著。
- 這次關機的 presync **兩個專案都推上來了**（21:33：這個專案 `9408321`、上一個專案 `8ed2cb1`；`vm-state.json` dirty 0、ahead 0、mods ok）——段 5 中途發現 1 這次沒再發生（上次沒推成是 VM `.local` 落後、舊版同步推不上去；這次出門先接好了）。這次關機花幾秒要下次開機才看得到。
- 家裡兩個專案的分支、HEAD、`worktree list`（md5）跟開 VM 前記下的相同（scratchpad `before-vm.txt`／`after-vm.txt`）。這個專案與上一個專案的 `.local` 跟 GitHub 一致（`main...origin/main`）。
- 「回家」對上一個專案 `checkout`＋`pull --ff-only` 是既有流程，分支本來就一樣，沒有變。

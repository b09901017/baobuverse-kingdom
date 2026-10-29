# 15 guard：工具收尾留下的幾個 Firebase 小洞（有額度才做）

Status: done（a、b：主控 2026-10-30，客廳 `2245538`；c、d、e：段 1，客廳 `1d3f7ec`、`6e144c7`、`5ae884e`）
Blocked by: c～e 等 14（同一組檔；14 做完、推了再開始）
動工前先讀：`../../tooling-leftovers/HANDOFF.md`「中途發現」段 1 第 3、4、5、7 條與「下一輪要做的」；客廳 `mods/guard/hooks/classify.ts`（`FIREBASE_CLI` 約 `:176`、`scriptHits`／`scriptPaths` 約 `:234-242`、gcloud firestore 的規則）、`hooks/register.ts`（`readScripts`）；`tests/not-executed.test.ts`、`tests/cli-forms.test.ts`。

## 使用者要的

> 還有什麼你覺得可以一段5 小時額度做完的就一起順手做吧 ?

（2026-10-30。主控挑的：都是小、多問為主，跟 14 同一組檔。）

## 做什麼（照順序；每一小條做完就 commit 客廳、推，額度到了就停在一條的邊界）

| # | 來源 | 現在 | 改成 | 多問／少問 |
|---|---|---|---|---|
| a | 段 1 第 3 條後半 | `powershell -enc <base64>`／`-EncodedCommand` 看不到字，不問 | 一律問（框上寫「指令是編碼過的，看不到要做什麼」） | 多問 |
| b | 段 1 第 7 條 | `gcloud config set project baobu-app && gcloud firestore import gs://…`：第二段沒寫 `--project`，認不出國王日記 | `gcloud firestore` 寫入沒寫 `--project` 時，看同一串前面的 `gcloud config set project`／`export CLOUDSDK_CORE_PROJECT=`；都沒有就當認不出、要問 | 多問 |
| c | 段 1 第 3 條前半 | python／node 串列 `['firebase', 'deploy', '--project', 'baobu-app']` 認不出 | firebase 的比對也認串列寫法（`'firebase', 'deploy'`） | 多問 |
| d | 段 1 第 4 條 | `bash x.sh`、`sh x.sh`、`./x.sh`、`source x.sh`、`. x.sh` 跑的腳本，guard 不讀內容 | `scriptPaths` 也認這幾種，讀內容當指令掃（跟 node／python 一樣） | 多問 |
| e | 段 1 第 5 條 | `node --check x.mjs` 當成跑腳本（只檢查語法） | `scriptPaths` 跳過 `node --check`／`-c`（python 的 `-c` 是程式碼，不能跳） | 少問（很小） |

## 判準

- 每一列各一條紅燈測試（測試字串用拼的，例如 `'fire'+'base'`，不然 guard 會把測試檔讀成要寫 Firebase）。
- `not-executed`、`legacy-parity`、`strict-default` 照過；既有測試不改。
- e 守住：`node x.mjs`、`python -c "…"` 照舊讀／掃。

## 不做

- 段 1 第 2 條（`gcloud firestore export` 要不要問）：要使用者決定，這一輪不做。

## 做完時留下的

（段寫：做了哪幾列、沒做的列寫「沒做（額度）」）

**a、b**（主控 2026-10-30，規劃的帳號用剩下的額度先做；客廳 `2245538`；guard 73 → 75，新的 `tests/small-holes.test.ts`）：
- a：新的風險種類 `opaque`（`KIND_WORD`「跑看不到內容的指令」），框上寫「指令是編碼過的（-EncodedCommand），看不到要做什麼」。旗標照 PowerShell 的縮寫規則：`-ec`，或 `e` 開頭又是 `encodedcommand` 的前綴（`-e`、`-en`、`-enc`、`-Enco`…）；看到 `-Command`／`-File`（含縮寫）就停，後面的不看。只掃遮過的字（`echo "powershell -enc …"` 不問）。
- b：`classify.ts` 的 gcloud firestore 迴圈：寫入那一段沒有 `--project[ =]` 時，往**同一串前面**找最後一個 `gcloud config set [core/]project X` 或 `CLOUDSDK_CORE_PROJECT=X`，當成 `--project=X` 再照 `neverWrite` 判斷；都找不到就推一條 `prodWrite`「沒寫 --project，看不出打哪一個專案」。之前的另一個指令設的 config 看不到，所以那種情況會問（多問，照設計）。
- 既有測試改一處：`not-executed.test.ts:240-241` 拿掉 `-enc` 例子（spec「允許改的既有測試」）。做 c 時同一條要再拿掉 python 例子。

**c、d、e**（段 1，14 與審查修完、額度 32% 時開始；每一列一個客廳 commit；guard 109 → 111，新測試都在 `tests/small-holes.test.ts`；tsc 0 錯、validate 過）：
- c（`1d3f7ec`）：`classify.ts` 的 `delist()`：一串用逗號隔開的字串（引號前可以有反斜線）裡有 `'firebase'`、`'firebase.cmd'`、`'firebase-tools'`，就把那一串的引號、逗號、括號換成空白（長度不變、位置對得上），firebase 那條規則照原本的認。
  認得 `subprocess.run(['firebase', 'deploy', …])`、`spawnSync('firebase', ['deploy', …])`、`execFileSync(\"firebase.cmd\", [...])`、`['npx', '-y', 'firebase-tools', 'deploy', …]`。讀的子指令、模擬器、echo 裡的串列照舊不問。
  `not-executed.test.ts` 釘住這個洞的那一條（只剩 python 那個例子）整條拿掉，留註解說搬去哪（spec「允許改的既有測試」）。
- d（`6e144c7`）：`scriptPaths` 也認 `bash`／`sh`／`zsh`／`dash`／`source x.sh`、指令開頭的 `. x.sh` 與 `./x.sh`（`cat ./x.sh`、`chmod +x ./x.sh`、`bash -c "…"` 不算），副檔名要 `.sh`／`.bash`。
  register.ts 照舊用 `readScripts` 讀；classify 把內容當一串 bash 指令再 classify 一次（不再往下讀它跑的腳本），**刪東西以外**的風險都算、理由前面加腳本名（`deploy.sh：firebase deploy …`），碰了什麼也記。
  腳本裡的刪檔案不看：跟 node／python 腳本一樣，刪東西只看指令本身（不然 `bash scripts/clean.sh` 裡的 `rm -rf dist` 會每次問，又沒有 14 的模型判斷）。
- e（`5ae884e`）：`scriptHits` 的 node 那一種，旗標有 `--check`／`-c` 就不算跑腳本。python 的 `-c` 是程式碼，照舊由「指令裡的程式」那一段掃（有測試守住）。

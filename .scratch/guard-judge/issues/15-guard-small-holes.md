# 15 guard：工具收尾留下的幾個 Firebase 小洞（有額度才做）

Status: todo
Blocked by: 14（同一組檔；14 做完、推了再開始）
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

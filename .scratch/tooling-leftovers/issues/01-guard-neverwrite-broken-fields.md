# 01 guard：補現在就有的「少問」洞（`neverWrite` 欄位壞掉、認不出的 firebase 寫法）

Status: done
Blocked by: 無
動工前先讀：`.scratch/legacy-to-home/HANDOFF.md`「中途發現」段 8 第 3、4 條、「段 7 審查結果」第 7 條；這份 HANDOFF「過目抓到的」01；
客廳 `mods/guard/hooks/classify.ts`（`rulesFrom` `:90-106`、`otherDatabase` `:148-152`、`badConfig` `:160-162`、firebase CLI `:243-251`、`gcloud firestore` `:285`、REST `:328-338`）、`mods/guard/tests/strict-default.test.ts`（`:137-203` 的寫法、`:139` 的 `BAD`）、客廳 `docs/project-config.md:29`

## 使用者要的

> 下一輪，候選清單就一起做吧，全部完成

（候選清單的這一條：段 8 中途發現 4。使用者 10/29 對段 7 第 1 題「`project.json` 讀不懂＝最嚴預設、碰 Firebase／gcloud 與 git push 一律要問」答「照建議」。過目另外找到的幾個洞也是「該問沒問」，一起補。）

## 為什麼會這樣

1. **`neverWrite` 欄位壞掉**：段 8 把「整個 `project.json` 讀不懂」改成最嚴預設＋一律要問（客廳 `32923b0`）。但檔案是合法 JSON、只是 `neverWrite` 壞掉時，
   `rulesFrom` 把不是陣列的當 `[]`（`:98`）、不合格的項目默默濾掉（`:99`）；`database` 不是字串時 `otherDatabase` 一律當成「別的 database」而跳過（CLI、gcloud、REST 三條都跳）。國王日記那道保護默默消失。
2. **認不出的 firebase 寫法**：`/\bfirebase\s+…/`（`:243`）認不得 `npx -y firebase-tools@latest deploy …`、`npx firebase-tools firestore:delete …`、`firebase.cmd deploy`。
   這正是這個 repo 的 Firebase skill 教的寫法，所以 `npx -y firebase-tools@latest firestore:delete -r / --project baobu-app` 現在**不問**。
3. **`gcloud` 全域旗標寫在前面**：`gcloud --project=baobu-app firestore import …` 不符合 `:285`。

## 判準（每一條先寫紅燈測試、確認紅，再修到綠）

- 讀不懂（＝最嚴預設＋碰 Firebase／gcloud 與 `git push`、`gh` 寫入一律要問）的 `neverWrite` 寫法：`{}`、`"baobu-app"`、`null`、`[{}]`、`[{"firebaseProject": 1}]`、`[{"gitRepo": ""}]`、
  `[{"firebaseProject": "baobu-app", "database": 1}]`、`[{"firebaseProject": "baobu-app", "why": 1}]`。各配「`gcloud firestore import … --project=baobu-app`」「推另一個 repo」：會不會**不問**？（要：都問）
- 框上的字：這時檔案是合法 JSON，框要寫出是 `neverWrite` 壞掉（例如「`.claude/project.json` 的 `neverWrite` 讀不懂」），開頭仍對得上 `strict-default.test.ts:139` 的 `BAD`。
- 不算壞的：`neverWrite` 不存在、`"neverWrite": []`、合法的那份（這個 repo 現在的）→ 跟現在逐條相同。
- `npx -y firebase-tools@latest deploy --project <正式站>`、`npx firebase-tools firestore:delete -r / --project baobu-app`、`firebase.cmd deploy`、`npm exec firebase-tools -- deploy`、`pnpm dlx firebase-tools deploy`：會不會**不問**？（要：跟 `firebase deploy` 同一種判斷）
- `gcloud --project=baobu-app firestore import …`、`gcloud --project baobu-app firestore export …`：會不會不問？（要：照 `neverWrite` 擋）
- 既有 guard 38 條一條都不改就全過；客廳 `docs/project-config.md:29`「型別不對當成沒寫」補一句「`neverWrite` 例外：型別不對＝讀不懂」。
- 這支只會多問；在 spec「行為會變的」列出新增會問的寫法。

## 做完時留下的（段 1，客廳 `d3bc4a0`）

- **`neverWrite` 壞掉＝讀不懂**：`neverWrite` 在、但不是陣列（`{}`、`null`、字串、`true`），或有一項不合格（不是物件、沒寫 `firebaseProject`／`gitRepo`、這兩個或 `database` 不是不空的字串、`why` 不是字串）。
  `Rules.broken` 從 `true` 變成 `true | 'neverWrite'`（整個檔讀不懂照舊是 `true`，既有測試不用改）。框上寫「`.claude/project.json` 讀不懂，先修好（neverWrite 那一欄格式不對，要是陣列、每一項寫 firebaseProject 或 gitRepo；…）」，開頭對得上 `strict-default.test.ts` 的 `BAD`。
- **firebase CLI 的寫法**：`FIREBASE_CLI` 一個 regex 認 `firebase`、`firebase.cmd／.exe／.ps1／.js`、套件執行器（`npx`、`npm exec`／`npm x`、`pnpm dlx`／`exec`、`yarn dlx`／`exec`、`bunx`、`bun x`）後面的 `firebase-tools[@版本]`；全域旗標可以寫在子指令前面。
  `firebase-tools` 只在套件執行器後面才算（`npm install firebase-tools typescript` 不記）；`-p`／`--package` 後面的是套件名（`npx -p firebase-tools@latest -y firebase deploy` 認後面那個 `firebase deploy`）。
- **`gcloud` 全域旗標在前**：`gcloud --project=… --quiet beta firestore import …` 照 `neverWrite` 擋。
- 新測試：`tests/cli-forms.test.ts` 5 條、`tests/neverwrite-config.test.ts` 6 條（含一條 register 接起來的）；guard 38 → 49，既有 38 條一字不改。客廳 `docs/project-config.md` 補「`neverWrite` 例外：型別不對＝讀不懂」與「讀不到設定時」一句。

跟 issue 寫的不同：

1. **讀不懂時的特例不是純最嚴預設**：最嚴預設，再加上這份檔自己寫的 `writeScripts`（聯集）與 `npmScripts`（同名以最嚴預設為準）。純換成最嚴預設會讓「`writeScripts` 寫了 `my-writer.mjs`、讀不到內容」的 `node my-writer.mjs` 從要問變成不問，違反「只會多問」。issue 列的壞法都沒寫腳本特例，所以規則跟最嚴預設逐欄相同（測試照 issue 判準比）。
2. **合格的項目照樣擋**：`neverWrite` 有一項壞掉時，其他合格的照樣出 `neverWrite`（框上兩個理由都有）。
3. **多認了幾種**：firebase 全域旗標寫在前面（`firebase --project prod deploy`，以前子指令被當成 `--project`、只記一筆讀）、`npm x`、`yarn dlx`、`bunx`、`firebase.exe／.ps1／.js`。都只會多問。
4. **`gcloud --project baobu-app firestore export …`**：issue 寫「照 `neverWrite` 擋」。做成「跟寫在後面的 `gcloud firestore export … --project baobu-app` 同一種判斷」——`export` 本來就不在寫入清單（它讀 database、寫到 GCS），所以照舊不問。要不要把 `export` 算進去記在 HANDOFF 中途發現。

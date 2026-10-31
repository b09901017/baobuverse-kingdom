# 01 帳戶互相看得到、步可以幫寶建帳戶、備註搬到自己的文件

Status: done
Blocked by: 無

動工前先讀：`../spec.md`「談定的」；`docs/adr/0001-events-as-source-numbers-at-read.md`；`firestore.rules` 的帳戶與 prefs；`apps/treasury/src/store.ts` 的 `watchCatalog`；`apps/treasury/src/reset.ts`；`apps/treasury/test/rules.test.ts` 的「帳戶」；`packages/core/src/test-kit.ts`；階段 0 HANDOFF「中途發現 · 段三」。

## 使用者要的

「誰出選寶時，帳戶欄收起來，不動任何餘額 : 是什麼意思，我沒辦法幫寶選他用哪個帳戶出嗎 ?」→ 主控建議互相看得到對方帳戶的名字與種類、餘額與備註看不到、寶搬過來前步可以幫寶建帳戶 →「照建議改」（2026-10-31）

## 為什麼會這樣

- `firestore.rules` 的 accounts：`allow read: if isMember(k) && me(k) in existing().owners`；`create` 要求 `meAfter(k) in incoming().owners`（`rules.test.ts`「建帳戶時自己要在主人裡」）。階段 0 AI 的設計，使用者定過的只有事件。
- `watchCatalog` 只查 `owners array-contains me`，所以步的 `Catalog` 沒有寶的帳戶；`validateEvent` 要求參考的帳戶找得到（`unknown-ref`），步選不到。
- `ledger.ts` 的 `othersCard` 看帳戶的 `paidByOthers`，帳戶不在 catalog 裡就是 false：步的帳本把寶刷寶媽卡算成寶的我付的（階段 0 中途發現 · 段三）。
- `Account.note` 在帳戶文件裡；規則不能只藏一個欄位，所以要搬出去。餘額本來就沒有存在帳戶文件（ADR 0001），開放讀取不會露出餘額。

## 做法（段可以改細節，改了寫進「做完時留下的」）

1. 規則：accounts 成員都讀得到；成員都可以建、改（寶搬過來之前步要能幫寶建、改；**階段 6 寶有帳號時收緊**，這句寫進規則的註解與 HANDOFF「中途發現」）。`delete` 不變（`canReset()` 且主人有我）。`validAccount` 拿掉 `note`。
2. 備註：`prefs/{p}` 多一個 `accountNotes`（map：帳戶 ID → 字串）。`prefs` 本來就只有本人讀寫，但規則的 `hasOnly(['accounts','jars','tags'])` 會拒絕新欄位，要加進去並檢查是 map。`Account.note` 從 `packages/core/src/model.ts` 拿掉，用到的地方一起改（`shape.test.ts`、`test-kit.ts`…先 grep）。共有帳戶每個人有自己的備註。
3. `store.ts`：`watchCatalog` 的帳戶改成查全部；加讀寫自己 prefs 的函式（排序、備註；04 用）。排序、備註在同一份文件：寫的時候要 merge，不能互相蓋掉。`RESET_DELETES` 的字補上備註。
4. core 補測試（先紅）：catalog 裡有寶的帳戶時，步的淨資產、餘額的數字；步記「寶刷寶媽卡」。
5. 文件：ADR 0001（「Firestore 上怎麼放」的帳戶與 prefs 兩列、第 8 點附近、「後果」裡看不到的帳戶那條；寫明 2026-10-31 改、使用者答「照建議改」）、GLOSSARY「帳戶」補一句誰看得到什麼、`model.ts` 註解「高級吃吃帶玩玩」換掉（使用者說不帶）、階段 0 HANDOFF 段三那兩條標「階段 1 解決」。

core 要繼續容忍看不到的帳戶（封存之外也可能查不到），不要把那段拿掉。

## 判準

- 寶（成員）讀得到步帳戶的名字、種類？沒登入、不是成員的人讀得到嗎？（規則測試）
- 帳戶文件存得進 `note` 或 `balance` 嗎？（應該被規則拒絕）
- 步讀得到寶的 `prefs`（備註、排序）嗎？（應該拒絕）
- 步記「寶刷寶媽卡 3,000，幫寶，冥想罐」：寶的我付的會多算嗎？寶的冥想罐我用的有算到 3,000 嗎？寶媽卡還欠有 3,000 嗎？步的我用的、我付的、淨資產有沒有動？
- 步記「寶刷寶的信用卡」：參與者有寶嗎？`book.total({ measure: "balance", person: 步 })` 會混進寶的帳戶嗎？`netWorth` 呢？
- 步能不能用寶的帳戶當自己的誰出？（`account-not-payers` 應該還擋著）
- 一鍵重置會不會去刪寶的帳戶？（查詢、規則都只動主人有我的）重置後寶的帳戶還在，再建一次同 ID 的帳戶會不會被拒絕？
- 改排序時備註會不會被蓋掉？改備註時排序呢？（`store.test.ts`）
- `Account.note` 拿掉之後，型別檢查、測試、畫面都沒有殘留？

## 做完時留下的

2026-10-31 段一。

**給 04、05 用的介面（`apps/treasury/src/store.ts`）**

| 函式 | 做什麼 |
|---|---|
| `watchCatalog(db, k, onChange, onError)` | 拿掉了 `me`：帳戶查全部（`Catalog.accounts` 有寶的）。**卡片牆、淨資產要自己篩**：`owners` 有我、`person: me` |
| `watchPrefs(db, k, me, onChange, onError)` | 自己的排序與備註；還沒存過收到 `{}` |
| `saveAccountOrder(db, k, me, order)` | 改卡片牆的排序，備註不動 |
| `saveAccountNote(db, k, me, account, note)` | 改一個帳戶的備註，空字串就拿掉那一格，排序與別格不動 |
| `Prefs` | `{ accounts?, jars?, tags?, accountNotes? }` |

**判準的結果**

| 判準 | 結果 |
|---|---|
| 寶（成員）讀得到步帳戶的名字、種類？沒登入、不是成員呢？ | 讀得到；後者讀不到、寫不了（`rules.test.ts`「帳戶」） |
| 帳戶文件存得進 `note`、`balance`？ | 都被拒絕 |
| 步讀得到寶的 `prefs`？ | 拒絕，寫也拒絕 |
| 步記「寶刷寶媽卡 3,000，幫寶，冥想罐」 | 寶的我付的 0、冥想罐 3,000、寶媽卡還欠 3,000；步的我用的、我付的、淨資產、餘額、往來帳都 0（`book.accounts.test.ts`） |
| 步記「寶刷寶的信用卡」 | 參與者有寶；`person: 步` 的餘額、淨資產沒有混進寶的帳戶 |
| 步用寶的帳戶當自己的誰出 | `account-not-payers` 還擋著 |
| 一鍵重置會去刪寶的帳戶嗎？重建同 ID 呢？ | 不會（查詢與規則都只動主人有我的，寶的帳戶內容一字不變）；同 ID 再建不會被拒絕 |
| 改排序、改備註互相蓋掉？ | 不會（`store.test.ts`，兩個方向都驗） |
| `Account.note` 有殘留？ | 沒有，只剩 `Event.note`、`Doubt.note`，型別檢查過 |

**測試第一次就綠的，故意弄壞看會不會紅（lessons 第十條）**：core 新加的 4 支第一次就綠，因為 core 本來就算得對。

| 弄壞什麼 | 紅了幾支 |
|---|---|
| `spend` 的寶媽卡判斷永遠 false | 10（含新的「步記寶刷寶媽卡」） |
| `holder` 永遠回傳記的人 | **一開始 0 支**：沒有測試涵蓋「步幫寶對帳」，補了「步幫寶記寶的銀行對帳 800」後紅 1 支 |
| `checkForBook` 也用嚴格檢查（不再容忍查不到的帳戶） | 3 |
| 規則：帳戶誰都讀得到 | 3 |
| 規則：別人的 `prefs` 也讀得到 | 1 |
| 規則：備註不檢查是 map | 1 |
| 規則：帳戶誰都刪得掉 | 2 |
| `saveAccountOrder` 不用 merge | 1 |

**比 issue 多做的**：驗證頁（`App.tsx`）的帳戶清單加了 `owners` 有我的篩選。`Catalog` 現在有寶的帳戶，不篩的話驗證頁會列出寶的帳戶和算出來的數字；04 會整頁換掉。

**改到的註解**：`Catalog`、`test-kit` 的 `catalog`、`寶的catalog`、`checkForBook`、`mover` 的「看不到的帳戶」改成「查不到的帳戶」（現在是沒同步到或之後收緊的情況，不是寶的帳本本來就沒有）。`validate.test.ts`、`book.views.test.ts` 的測試名稱還叫「看不到的帳戶」，意思對（參考資料裡沒有），沒動。

## Comments

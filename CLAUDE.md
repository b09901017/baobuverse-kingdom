# 寶步宇宙王國

寫任何程式碼之前，先讀 `CONTEXT.md`（詞彙）與 `docs/spec.md`（規格）。
決策理由與**刻意不做的事**在 `docs/adr/`。

## 不能違反

- 一次動作寫**一則**事件。帳戶餘額、日記、物品、追劇進度都是投影，不直接寫入。
- 事件 append-only。畫面上的「編輯」和「刪除」，底層都是追加修正事件。
- 所有投影必須以事件 id 去重。Firestore 觸發是 at-least-once，漏做會重複扣款。
- 支出與轉帳的差別只看入方是不是外部節點。不要為此新增類型欄位。
- **絕對不寫入** `baobu_money_track`，也不寫入 `baobu-app` 的預設 database。
- 結構化資料（金額、帳戶、標籤、對象）各自獨立成欄位，不塞進備註。
- 不做預先彙總表。不做找規律的演算法。

## 環境

- skill 放 `.claude/skills/` 並 commit。雲端 session 不讀 `~/.claude/skills/`。
- Playwright 的瀏覽器路徑有陷阱，見 `docs/env-notes.md`。

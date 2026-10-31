// core 的問題代碼換成白話：代碼不跳到使用者臉上。

import type { Event, Problem, ProblemCode } from "@baobu/core";

// Record：core 新加一種代碼，這裡沒寫就過不了型別檢查
const TEXT: Readonly<Record<ProblemCode, string>> = {
  "amount-invalid": "金額要是大於 0 的整數",
  "no-items": "這筆沒有內容",
  "items-sum-mismatch": "品項加起來跟整筆的金額不一樣",
  "duplicate-id": "同一筆裡有重複的項目",
  "unknown-ref": "用到的帳戶、罐子或標籤找不到（可能還沒同步到這台裝置）",
  "account-not-payers": "這個帳戶不是誰出的那個人的",
  "shared-account-expense": "共有的帳戶不能直接付支出",
  "income-account": "這個帳戶不是收錢的那個人的",
  "transfer-owners": "轉帳兩邊要是同一個人（或共有）的帳戶",
  "transfer-same-account": "轉帳兩邊是同一個帳戶",
  "transfer-others-account": "進出別人繳的帳戶（寶媽卡）是還款，不是轉帳",
  "repayment-parties": "還款的兩邊不對",
  "reconcile-investment": "投資帳戶不對帳",
  "weights-invalid": "比例要是正整數，也只能有王國裡的人",
  "receivable-too-big": "朋友要還的比這一項還多",
  "amortize-invalid": "按月攤的月數要是 2 以上的整數",
  "cash-invalid": "直接給錢只能用在幫對方、不用還的品項",
  "refund-target": "退款要排在原本那筆之後，而且原本那筆要還在",
  "refund-too-big": "退款超過這一項還沒退的金額",
  "refund-account": "這筆錢不能退到這個帳戶",
  "refunded-item-changed": "這筆已經有退款，要改這裡要先刪退款",
  "allocation-invalid": "指定要抵的那一筆不對",
};

/** 一批問題的白話，重複的只留一句 */
export function problemTexts(problems: readonly Problem[]): readonly string[] {
  return [...new Set(problems.map((p) => TEXT[p.code]))];
}

/** 帳本沒算進去的事件：是哪一則、什麼原因（一則一列） */
export function unsettled(problems: readonly Problem[], events: readonly Event[]): readonly { readonly event: string; readonly reasons: readonly string[] }[] {
  const ids = [...new Set(problems.map((p) => p.event))];
  return ids.map((id) => {
    const event = events.find((e) => e.id === id);
    return {
      event: event === undefined ? "（找不到這一則）" : `${event.date} ${event.title ?? "沒有名稱的一筆"}`,
      reasons: problemTexts(problems.filter((p) => p.event === id)),
    };
  });
}

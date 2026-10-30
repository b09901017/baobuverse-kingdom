// 存之前的檢查，與誰看得到一則事件（參與者）。規則的實作在 issue 04。

import type { Catalog, EntryId, Event, EventId, ItemId, PersonId } from "./model";

export type ProblemCode =
  | "amount-invalid" // 金額不是正整數（對帳的實際餘額可以是 0 或負數）
  | "no-items" // 支出沒有品項
  | "items-sum-mismatch" // 品項加起來不等於整筆
  | "duplicate-id" // 同一則事件裡一筆的 ID、同一筆裡品項的 ID 重複
  | "unknown-ref" // 找不到的人、帳戶、罐子、標籤
  | "account-not-payers" // 支出的帳戶不是誰出那個人的
  | "shared-account-expense" // 共有的帳戶付支出（現在不支援）
  | "income-account" // 收入的帳戶不是收的那個人的
  | "transfer-owners" // 轉帳兩邊不是同一個人（或共有）的帳戶
  | "transfer-same-account"
  | "transfer-others-account" // 轉帳進出寶媽卡：那是還款
  | "repayment-parties" // 還款兩邊的組合不對（例如朋友還寶媽卡）
  | "reconcile-investment" // 投資帳戶不對帳（不記市值）
  | "weights-invalid" // 比例不是正數，或裡面有王國以外的人
  | "receivable-too-big" // 待收比那一項還多
  | "amortize-invalid" // 按月攤的月數小於 2
  | "cash-invalid" // 直接給錢用在不是「幫對方、不用還」的品項
  | "refund-target" // 退款指到不存在的品項
  | "refund-too-big" // 退款超過那一項還沒退的
  | "allocation-invalid"; // 手動指定的還款指到不存在的、或不是這一種要還的錢

export interface Problem {
  readonly event: EventId;
  readonly code: ProblemCode;
  readonly entry?: EntryId;
  readonly item?: ItemId;
}

/**
 * 存之前檢查一則事件；沒有問題就回傳空陣列。參考資料要找得到（記的人看得到自己要用的帳戶、罐子、標籤）。
 * 給了 events 才檢查要對照別則事件的（退款、手動指定的還款）。
 */
export function validateEvent(event: Event, catalog: Catalog, events?: readonly Event[]): readonly Problem[] {
  throw new Error("還沒做：issue 04");
}

/**
 * 參與者：看得到這則事件的人。記的人、誰出、幫誰（共＝每一個人）、收入或直接給錢收錢的人、
 * 動到的帳戶的主人（共有帳戶是每一個主人）、還款兩邊的人；退款再加上原本那則的參與者（要給 events）。
 * 回傳排好序、不重複。app 存事件時把它存進文件，給安全規則和查詢用（ADR 0001）。
 */
export function participantsOf(event: Event, catalog: Catalog, events?: readonly Event[]): readonly PersonId[] {
  throw new Error("還沒做：issue 04");
}

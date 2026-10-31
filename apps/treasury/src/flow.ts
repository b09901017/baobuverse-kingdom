// 流水頁（stage-1 issue 05）：事件 → 依日期倒排、同一天一組的列。純函式，畫面在 screens/FlowScreen.tsx。
// 流水不是一張表：是看得到的事件的查詢結果（README「日記不是一張表」同一個道理）。支出、收入先有；轉帳、對帳、退款 06 接。

import { byTime, type AccountId, type Catalog, type EntryId, type Event, type EventId, type Expense, type Income, type LocalDate, type PersonId } from "@baobu/core";

export interface FlowRow {
  readonly event: EventId;
  readonly entry: EntryId;
  readonly title: string;
  /** 有正負號：支出是負的，收入是正的 */
  readonly amount: number;
  /** 帳戶的名字；不知道就沒有 */
  readonly account?: string;
  /** 「步 → 共」；幫自己付的不用寫 */
  readonly who?: string;
}

export interface FlowDay {
  readonly date: LocalDate;
  readonly rows: readonly FlowRow[];
}

/** 依日期倒排、同一天新的在上面。給了 account 只列動到那個帳戶的 */
export function flowDays(events: readonly Event[], catalog: Catalog, me: PersonId, filter: { readonly account?: AccountId } = {}): readonly FlowDay[] {
  const days: { date: LocalDate; rows: FlowRow[] }[] = [];
  for (const event of [...events].sort(byTime).reverse()) {
    if (event.status !== "confirmed") continue;
    for (const m of event.effects) {
      if ((m.kind !== "expense" && m.kind !== "income") || (filter.account !== undefined && m.account !== filter.account)) continue;
      let day = days.at(-1);
      if (day?.date !== event.date) {
        day = { date: event.date, rows: [] };
        days.push(day);
      }
      day.rows.push(rowOf(event, m, catalog, me));
    }
  }
  return days;
}

function rowOf(event: Event, m: Expense | Income, catalog: Catalog, me: PersonId): FlowRow {
  const person = (id: PersonId) => catalog.people.find((p) => p.id === id)?.name ?? id;
  const account = catalog.accounts.find((a) => a.id === m.account)?.name;
  const tagNames = (m.kind === "expense" ? [...m.tags, ...m.items.flatMap((i) => i.tags)] : m.tags).map((id) => catalog.tags.find((t) => t.id === id)?.name ?? "").filter((name) => name !== "");
  const title = event.title ?? (tagNames.length > 0 ? tagNames.join("、") : m.kind === "expense" ? "支出" : "收入");
  const who = m.kind === "expense" ? whoPaid(m, person, me) : m.person === me ? undefined : `${person(m.person)}收`;
  return {
    event: event.id,
    entry: m.id,
    title,
    amount: m.kind === "expense" ? -m.amount : m.amount,
    ...(account === undefined ? {} : { account }),
    ...(who === undefined ? {} : { who }),
  };
}

/** 幫自己付的不用寫；不過是對方付自己的（我幫對方記的），不寫的話看起來像我自己花的 */
function whoPaid(m: Expense, person: (id: PersonId) => string, me: PersonId): string | undefined {
  const b = m.beneficiary;
  if (b.kind === "shared") return `${person(m.payer)} → 共`;
  if (b.person !== m.payer) return `${person(m.payer)} → ${person(b.person)}`;
  return m.payer === me ? undefined : `${person(m.payer)}自己付`;
}

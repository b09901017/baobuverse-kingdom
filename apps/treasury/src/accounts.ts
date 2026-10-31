// 帳戶頁的邏輯（stage-1 issue 04）：誰的帳戶、卡片牆的順序、卡片上的字、新增帳戶要存什麼。都是純函式，畫面在 screens/。

import type {
  Account,
  AccountId,
  AccountKind,
  Book,
  Catalog,
  Event,
  EventId,
  LocalDate,
  MoneyEffect,
  Person,
  PersonId,
} from "@baobu/core";
import { ENTRY_ID, type Parsed } from "./event-form";
import { daysBetween, money } from "./format";
import { NOTE_MAX, isPresetEvent } from "./presets";
import { refundTargetAt } from "./refund";
import type { Changes } from "./store";

export const KIND_LABEL: Readonly<Record<AccountKind, string>> = {
  cash: "現金",
  "stored-value": "儲值",
  bank: "銀行",
  "credit-card": "信用卡",
  investment: "投資",
};

/** 種類的順序：新增時的選單；還沒有使用紀錄時卡片也照它排（錢包在上面） */
export const KINDS: readonly AccountKind[] = ["cash", "stored-value", "bank", "credit-card", "investment"];

/** 帳戶選單上的字 */
export const accountLabel = (a: Account): string => `${a.name}（${KIND_LABEL[a.kind]}）${a.archived ? "（封存了）" : ""}`;

/** 帳戶的名字；參考資料裡沒有（還沒同步到）時也有字 */
export const accountName = (id: AccountId | undefined, catalog: Catalog): string => catalog.accounts.find((a) => a.id === id)?.name ?? "查不到的帳戶";

/** 主人有我的（含共有）：卡片牆只放這些，對方的帳戶不出現 */
export function myAccounts(catalog: Catalog, me: PersonId): readonly Account[] {
  return catalog.accounts.filter((a) => a.owners.includes(me));
}

/** 只屬於別人的帳戶（步幫寶建的）：不顯示餘額、沒有備註，只在設定頁收得到 */
export function othersAccounts(catalog: Catalog, me: PersonId): readonly Account[] {
  return catalog.accounts.filter((a) => !a.owners.includes(me));
}

/** 這一筆動到哪些帳戶（卡片牆的次數、流水頁的篩選都看這個）。沒寫帳戶的退款動到原本那筆的帳戶，跟帳本同一個算法 */
export function accountsMoved(m: MoneyEffect, events: readonly Event[]): readonly AccountId[] {
  const known = (ids: readonly (AccountId | undefined)[]) => ids.filter((id) => id !== undefined);
  switch (m.kind) {
    case "expense":
    case "income":
    case "reconciliation":
      return known([m.account]);
    case "refund":
      return known([m.account ?? refundTargetAt(events, m.target)?.expense.account]);
    case "transfer":
      return [m.from, m.to];
    case "repayment":
      return known([m.from, m.to].map((side) => (side.kind === "outside" ? undefined : side.account)));
  }
}

/** 每個帳戶用過幾次：對帳不算（那是看餘額，不是用它），套用預設寫的也不算 */
export function usageCounts(events: readonly Event[]): ReadonlyMap<AccountId, number> {
  const counts = new Map<AccountId, number>();
  for (const event of events) {
    if (event.status !== "confirmed" || isPresetEvent(event.id)) continue;
    for (const m of event.effects) {
      if (m.kind === "reconciliation") continue;
      for (const id of accountsMoved(m, events)) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return counts;
}

/** 卡片的順序：沒拖過時最常用的在上面；拖過照存的，存的裡面沒有的（新帳戶）排最後 */
export function wallOrder(accounts: readonly Account[], saved: readonly AccountId[] | undefined, events: readonly Event[]): readonly Account[] {
  const uses = usageCounts(events);
  const auto = [...accounts].sort(
    (a, b) =>
      (uses.get(b.id) ?? 0) - (uses.get(a.id) ?? 0) ||
      KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind) ||
      a.name.localeCompare(b.name, "zh-TW") ||
      (a.id < b.id ? -1 : 1),
  );
  const at = new Map((saved ?? []).map((id, i) => [id, i]));
  return [
    ...auto.filter((a) => at.has(a.id)).sort((a, b) => (at.get(a.id) ?? 0) - (at.get(b.id) ?? 0)),
    ...auto.filter((a) => !at.has(a.id)),
  ];
}

/**
 * 拖完的順序。order 要含封存的：封存的帳戶留在原本的位置，解封後回到那裡。
 * active 拖到 over 的位置（兩個都不在就不動）。
 */
export function moved(order: readonly AccountId[], active: AccountId, over: AccountId): readonly AccountId[] {
  const from = order.indexOf(active);
  const to = order.indexOf(over);
  if (from < 0 || to < 0 || from === to) return order;
  const next = [...order];
  next.splice(from, 1);
  next.splice(to, 0, active);
  return next;
}

/** 這個帳戶最後一次對帳是哪一天。要看事件：差額是 0 時帳本沒有那一行 */
export function lastReconciled(events: readonly Event[], account: AccountId): LocalDate | undefined {
  let last: LocalDate | undefined;
  for (const event of events) {
    if (event.status !== "confirmed") continue;
    const hit = event.effects.some((m) => m.kind === "reconciliation" && m.account === account);
    if (hit && (last === undefined || event.date > last)) last = event.date;
  }
  return last;
}

/** 超過這麼多天才提醒（spec「主控定的」） */
const STALE_DAYS = 30;

/** 卡片上關於對帳的那句；沒什麼要說的是 null。投資帳戶不對帳，都不寫 */
export function reconcileNote(account: Account, events: readonly Event[], today: LocalDate): string | null {
  if (account.kind === "investment") return null;
  const last = lastReconciled(events, account.id);
  if (last === undefined) return "還沒對帳";
  const days = daysBetween(last, today);
  return days > STALE_DAYS ? `${days} 天沒對帳` : null;
}

/** 卡片上的餘額。信用卡寫欠多少 */
export function balanceText(account: Account, balance: number): string {
  if (account.kind !== "credit-card") return `${money(balance)} 元`;
  return balance > 0 ? `多繳 ${money(balance)} 元` : `欠 ${money(-balance)} 元`;
}

/** 共有帳戶每個人各投入多少（投入減拿出）；不是共有的沒有這一段 */
export function sharesOf(account: Account, book: Book, people: readonly Person[]): readonly { readonly name: string; readonly amount: number }[] {
  if (account.owners.length < 2) return [];
  return account.owners.map((owner) => ({
    name: people.find((p) => p.id === owner)?.name ?? owner,
    amount: book.total({ measure: "balance", person: owner, where: { account: account.id } }),
  }));
}

/** 選項裡自己排第一（Firestore 讀回來是照 ID 排的） */
export function meFirst(people: readonly Person[], me: PersonId): readonly Person[] {
  return [...people.filter((p) => p.id === me), ...people.filter((p) => p.id !== me)];
}

/** 主人的選法：一個人，或共有（"shared"，只有投資帳戶能選，plan.md：目前沒有共同帳戶） */
export type OwnerChoice = PersonId | "shared";

export function ownerChoices(kind: AccountKind, people: readonly Person[], me: PersonId): readonly { readonly value: OwnerChoice; readonly label: string }[] {
  const each = meFirst(people, me).map((p) => ({ value: p.id, label: p.name }));
  return kind === "investment" ? [...each, { value: "shared" as const, label: "共有" }] : each;
}

export interface AccountForm {
  readonly name: string;
  readonly kind: AccountKind;
  readonly owner: OwnerChoice;
  /** 帳單別人繳（寶媽卡）：只有信用卡能選 */
  readonly paidByOthers: boolean;
  readonly note: string;
  /** 現在的餘額；信用卡是欠多少。空白就是之後再對帳 */
  readonly balance: string;
}

/** 新增時能不能順便填餘額：只有自己的、非投資的帳戶（別人的帳戶，對帳事件的參與者會多出別人；投資帳戶不對帳） */
export const canFillBalance = (form: Pick<AccountForm, "kind" | "owner">, me: PersonId): boolean =>
  form.owner === me && form.kind !== "investment";

/** 能不能寫備註：主人有我才有（備註是自己 prefs 裡的一格） */
export const canWriteNote = (owner: OwnerChoice, me: PersonId): boolean => owner === me || owner === "shared";

/** 有正負號的整數（可以是負的：透支）。逗號可以打。空白由呼叫的人決定要不要算錯，這裡當成不是數字 */
export function parseWhole(text: string): Parsed<number> {
  const clean = text.replaceAll(",", "").trim().replace(/^[−－]/, "-");
  if (!/^-?\d+$/.test(clean) || !Number.isSafeInteger(Number(clean))) return { ok: false, error: "餘額要是整數" };
  return { ok: true, value: Number(clean) };
}

/** 看著實際餘額輸入的數字 → 存的數字。信用卡輸入欠多少（不能是負的），存成負數；其他可以是負的 */
export function parseActual(text: string, kind: AccountKind): Parsed<number> {
  const n = parseWhole(text);
  if (!n.ok || kind !== "credit-card") return n;
  if (n.value < 0) return { ok: false, error: "信用卡填欠多少，不用寫負號" };
  return { ok: true, value: n.value === 0 ? 0 : -n.value };
}

/** 名字、備註的檢查（新增與改帳戶共用） */
export function checkAccountText(form: Pick<AccountForm, "name" | "note">): readonly string[] {
  const name = form.name.trim();
  return [
    ...(name === "" ? ["要取一個名字"] : []),
    ...(name.length > 40 ? ["名字最多 40 字"] : []),
    ...(form.note.length > NOTE_MAX ? [`備註最多 ${NOTE_MAX} 字`] : []),
  ];
}

/** 表單有什麼問題；空的就可以存 */
export function checkAccountForm(form: AccountForm, me: PersonId): readonly string[] {
  const errors = [...checkAccountText(form)];
  if (form.owner === "shared" && form.kind !== "investment") errors.push("共有的帳戶只能是投資（目前沒有共同帳戶）");
  if (canFillBalance(form, me) && form.balance.trim() !== "") {
    const balance = parseActual(form.balance, form.kind);
    if (!balance.ok) errors.push(balance.error);
  }
  return errors;
}

/**
 * 新增帳戶要存的東西（同一批）：帳戶，加上填了餘額時的第一次對帳，寫了備註時自己 prefs 的一格。
 * 別人的帳戶、投資帳戶就算表單裡有字也不存（不只靠畫面藏起來）。
 */
export function newAccountChanges(
  form: AccountForm,
  ctx: {
    readonly me: PersonId;
    readonly people: readonly Person[];
    readonly accountId: AccountId;
    readonly eventId: EventId;
    readonly now: number;
    readonly today: LocalDate;
  },
): Changes {
  const { me, accountId, today, now } = ctx;
  const owners = form.owner === "shared" ? ctx.people.map((p) => p.id) : [form.owner];
  const account: Account = {
    id: accountId,
    name: form.name.trim(),
    kind: form.kind,
    owners,
    currency: "TWD",
    ...(form.paidByOthers && form.kind === "credit-card" ? { paidByOthers: true as const } : {}),
  };
  const balance = canFillBalance(form, me) && form.balance.trim() !== "" ? parseActual(form.balance, form.kind) : undefined;
  const note = form.note.trim();
  return {
    accounts: [account],
    ...(balance?.ok === true
      ? {
          events: [
            {
              id: ctx.eventId,
              date: today,
              title: "初始餘額",
              recordedBy: me,
              recordedAt: now,
              source: "manual" as const,
              status: "confirmed" as const,
              effects: [{ type: "money" as const, id: ENTRY_ID, kind: "reconciliation" as const, account: accountId, actual: balance.value }],
            },
          ],
        }
      : {}),
    ...(note !== "" && canWriteNote(form.owner, me) ? { prefs: { of: me, set: { accountNotes: { [accountId]: note } } } } : {}),
  };
}

/** 封存或解封：有餘額也可以封存，數字照算，只是不進選單、卡片收到最下面。解封要把欄位拿掉（規則只收 true） */
export function withArchived(account: Account, archived: boolean): Account {
  const { archived: _archived, ...rest } = account;
  return archived ? { ...rest, archived: true } : rest;
}

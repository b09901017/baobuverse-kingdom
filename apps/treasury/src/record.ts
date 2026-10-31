// 記一筆的邏輯（stage-1 issue 05）：表單的值 → 事件、預設值、帳戶／罐子／標籤的選單。都是純函式，畫面在 screens/RecordScreen.tsx。
// 階段 1 沒有拆品項的畫面：一筆一項，事件的 title 和品項的 name 一樣。

import { blockersOfDelete } from "@baobu/core";
import type {
  Account,
  AccountId,
  Beneficiary,
  Catalog,
  EntryId,
  Event,
  EventId,
  Expense,
  Income,
  ItemId,
  Jar,
  JarId,
  LocalDate,
  LocalTime,
  PersonId,
  Tag,
  TagId,
} from "@baobu/core";
import type { Parsed } from "./accounts";
import { dateOf, timeOf } from "./format";
import { DAILY_JAR } from "./presets";
import type { Changes } from "./store";

export type RecordKind = "expense" | "income";
/** 幫誰：一個人，或共 */
export type Helped = PersonId | "shared";

export interface RecordForm {
  readonly kind: RecordKind;
  readonly amount: string;
  readonly title: string;
  /** 支出是誰出，收入是誰收 */
  readonly person: PersonId;
  /** 空字串是不知道：不動任何帳戶的餘額 */
  readonly account: AccountId | "";
  /** 支出才有 */
  readonly helped: Helped;
  /** 支出才有；收入不分罐子 */
  readonly jar: JarId;
  readonly tags: readonly TagId[];
  readonly date: LocalDate;
  /** 空字串是沒寫時間 */
  readonly time: LocalTime | "";
}

/** 金額：大於 0 的整數。逗號可以打（1,000），其他都擋下來、講清楚 */
export function parseAmount(text: string): Parsed<number> {
  const clean = text.replaceAll(",", "").trim();
  if (clean === "") return { ok: false, error: "要填金額" };
  if (/^[-−－]/.test(clean)) return { ok: false, error: "金額不能是負的" };
  if (/^\d*\.\d*$/.test(clean)) return { ok: false, error: "金額要是整數，不能有小數" };
  if (!/^\d+$/.test(clean)) return { ok: false, error: "金額只能是數字" };
  const n = Number(clean);
  if (n === 0) return { ok: false, error: "金額要大於 0" };
  if (!Number.isSafeInteger(n)) return { ok: false, error: "金額太大了" };
  return { ok: true, value: n };
}

/** 表單有什麼問題；空的就可以存。必填的只有金額（日期有預設，清空了才會擋） */
export function checkRecordForm(form: RecordForm): readonly string[] {
  const errors: string[] = [];
  const amount = parseAmount(form.amount);
  if (!amount.ok) errors.push(amount.error);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) errors.push("要填日期");
  if (form.time !== "" && !/^\d{2}:\d{2}$/.test(form.time)) errors.push("時間的格式不對");
  if (form.title.length > 200) errors.push("名稱最多 200 字");
  return errors;
}

// ── 選單 ──────────────────────────────────────────────────

/**
 * 帳戶選單：那個人沒封存的帳戶，不含投資（進出都是轉帳；core 不一定擋得到）與共有的；收入也不含寶媽卡（還它是還款）。
 * current 是這一筆現在用的（改一筆時）：就算封存了也要在，不然表單變空、存成「不知道」，餘額會默默變。
 * 換了人之後就不是那個人的了，所以還是要主人有這個人。
 */
export function accountOptions(accounts: readonly Account[], kind: RecordKind, person: PersonId, current?: AccountId | ""): readonly Account[] {
  return accounts.filter((a) => {
    if (!a.owners.includes(person)) return false;
    if (a.id === current) return true;
    if (a.archived || a.kind === "investment" || a.owners.length > 1) return false;
    return kind === "expense" || a.paidByOthers !== true;
  });
}

/** 那個人上次用的帳戶（還在選單裡的）；沒有就是他的現金帳戶；再沒有就是不知道 */
export function lastAccount(catalog: Catalog, events: readonly Event[], kind: RecordKind, person: PersonId): AccountId | "" {
  const options = accountOptions(catalog.accounts, kind, person);
  for (const event of newestFirst(events)) {
    for (const m of event.effects) {
      const used = m.kind === "expense" && kind === "expense" && m.payer === person ? m.account : m.kind === "income" && kind === "income" && m.person === person ? m.account : undefined;
      if (used !== undefined && options.some((a) => a.id === used)) return used;
    }
  }
  return options.find((a) => a.kind === "cash")?.id ?? "";
}

export function newestFirst(events: readonly Event[]): readonly Event[] {
  return [...events].filter((e) => e.status === "confirmed").sort((a, b) => b.recordedAt - a.recordedAt);
}

/** 日常：沒有就用固定 ID 建一個（還沒套用預設時），先記一筆再套用才不會有兩個日常 */
function dailyJar(catalog: Catalog): Jar {
  return catalog.jars.find((j) => j.id === DAILY_JAR) ?? { id: DAILY_JAR, name: "日常", owners: catalog.people.map((p) => p.id) };
}

/** 這個罐子能不能記給這個幫誰：幫一個人要是他的罐子；幫共要兩個人都有（共付的每個人那一份算在同一個罐子） */
function jarFits(jar: Jar, helped: Helped, catalog: Catalog): boolean {
  return helped === "shared" ? catalog.people.every((p) => jar.owners.includes(p.id)) : jar.owners.includes(helped);
}

/** 罐子選單：日常在最前面；current 是這一筆現在用的（封存了也要在） */
export function jarOptions(catalog: Catalog, helped: Helped, current?: JarId): readonly Jar[] {
  const daily = dailyJar(catalog);
  const others = catalog.jars.filter((j) => j.id !== DAILY_JAR && (j.id === current || (!j.archived && jarFits(j, helped, catalog))));
  return [daily, ...others];
}

/** 標籤用過幾次：一則事件算一次 */
function tagUsage(events: readonly Event[]): ReadonlyMap<TagId, number> {
  const counts = new Map<TagId, number>();
  for (const event of events) {
    if (event.status !== "confirmed") continue;
    const seen = new Set<TagId>();
    for (const m of event.effects) {
      if (m.kind === "income") for (const t of m.tags) seen.add(t);
      if (m.kind === "expense") for (const t of [...m.tags, ...m.items.flatMap((i) => i.tags)]) seen.add(t);
    }
    for (const t of seen) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return counts;
}

/** 標籤的順序：用過多的在前面；一樣多照 prefs 的順序（預設的順序）；不在 prefs 的（當場加的）排後面。封存的、併進別的不列，除非這一筆正在用 */
export function rankTags(tags: readonly Tag[], events: readonly Event[], order: readonly TagId[] | undefined, selected: readonly TagId[] = []): readonly Tag[] {
  const uses = tagUsage(events);
  const at = new Map((order ?? []).map((id, i) => [id, i]));
  const place = (t: Tag) => at.get(t.id) ?? Number.MAX_SAFE_INTEGER;
  return tags
    .filter((t) => selected.includes(t.id) || (!t.archived && t.mergedInto === undefined))
    .sort((a, b) => (uses.get(b.id) ?? 0) - (uses.get(a.id) ?? 0) || place(a) - place(b) || a.name.localeCompare(b.name, "zh-TW"));
}

/** 「更多」收起來時先顯示幾個（spec：標籤太多不好選） */
export const QUICK_TAGS = 8;

/** 畫面上現在要列的標籤：收起來時是最常用的幾個，加上已經選了的（不然選了看不到） */
export function visibleTags(ranked: readonly Tag[], selected: readonly TagId[], expanded: boolean): readonly Tag[] {
  if (expanded) return ranked;
  return ranked.filter((t, i) => i < QUICK_TAGS || selected.includes(t.id));
}

/** 當場加標籤：同名的就用原本那個，不多建一個 */
export function tagFromName(name: string, tags: readonly Tag[], id: TagId): Parsed<{ readonly tag: Tag; readonly isNew: boolean }> {
  const clean = name.trim();
  if (clean === "") return { ok: false, error: "標籤要有名字" };
  if (clean.length > 40) return { ok: false, error: "標籤最多 40 字" };
  const same = tags.find((t) => t.name === clean);
  return { ok: true, value: same === undefined ? { tag: { id, name: clean }, isNew: true } : { tag: same, isNew: false } };
}

// ── 預設值與連動 ──────────────────────────────────────────

const helpedOf = (b: Beneficiary): Helped => (b.kind === "person" ? b.person : "shared");

/**
 * 新的一筆的預設。誰出、幫誰跟我上一筆支出一樣（刪掉的不算，因為 events 裡已經沒有）；帳戶是那個人上次用的；
 * 時間是現在；沒選罐子算日常。收入：誰收預設自己。
 */
export function defaultForm(kind: RecordKind, ctx: { readonly me: PersonId; readonly catalog: Catalog; readonly events: readonly Event[]; readonly now: Date }): RecordForm {
  const { me, catalog, events, now } = ctx;
  let person = me;
  let helped: Helped = me;
  if (kind === "expense") {
    const mine = newestFirst(events).filter((e) => e.recordedBy === me);
    const last = mine.flatMap((e) => e.effects).find((m): m is Expense => m.kind === "expense");
    if (last !== undefined) {
      person = last.payer;
      helped = helpedOf(last.beneficiary);
    }
  }
  return {
    kind,
    amount: "",
    title: "",
    person,
    account: lastAccount(catalog, events, kind, person),
    helped,
    jar: DAILY_JAR,
    tags: [],
    date: dateOf(now),
    time: timeOf(now),
  };
}

/** 換了誰出（誰收）：帳戶跟著換成那個人上次用的，不會留著另一個人的 */
export function withPerson(form: RecordForm, person: PersonId, catalog: Catalog, events: readonly Event[]): RecordForm {
  if (person === form.person) return form;
  return { ...form, person, account: lastAccount(catalog, events, form.kind, person) };
}

/** 換了幫誰：原本的罐子不合這個幫誰就回到日常 */
export function withHelped(form: RecordForm, helped: Helped, catalog: Catalog): RecordForm {
  const jar = catalog.jars.find((j) => j.id === form.jar);
  return { ...form, helped, jar: jar === undefined || jarFits(jar, helped, catalog) ? form.jar : DAILY_JAR };
}

/** 切換支出、收入：帳戶清單不同（收入沒有寶媽卡），誰收預設自己，帳戶重帶。金額、名稱、標籤、時間留著 */
export function withKind(form: RecordForm, kind: RecordKind, ctx: { readonly me: PersonId; readonly catalog: Catalog; readonly events: readonly Event[]; readonly now: Date }): RecordForm {
  if (kind === form.kind) return form;
  const fresh = defaultForm(kind, ctx);
  return { ...fresh, amount: form.amount, title: form.title, tags: form.tags, date: form.date, time: form.time };
}

// ── 改一筆 ────────────────────────────────────────────────

/** 這則事件打得開表單嗎：一則一筆、一筆一項、品項沒有自己的幫誰（階段 1 的表單表達不了的，不要假裝改得了） */
export function formOf(event: Event): RecordForm | null {
  const [m, ...rest] = event.effects;
  if (m === undefined || rest.length > 0) return null;
  const shared = { title: event.title ?? "", date: event.date, time: event.time ?? ("" as const), amount: String(m.kind === "reconciliation" ? 0 : m.amount) };
  if (m.kind === "income") {
    return { ...shared, kind: "income", person: m.person, account: m.account ?? "", helped: m.person, jar: DAILY_JAR, tags: m.tags };
  }
  if (m.kind !== "expense" || m.items.length !== 1) return null;
  const [item] = m.items;
  if (item === undefined || item.beneficiary !== undefined) return null;
  return {
    ...shared,
    title: event.title ?? item.name ?? "",
    kind: "expense",
    person: m.payer,
    account: m.account ?? "",
    helped: helpedOf(m.beneficiary),
    jar: item.jar,
    tags: [...new Set([...m.tags, ...item.tags])],
  };
}

/** 這筆有沒有退款：有的話誰出、幫誰鎖住（issue 02），也不能刪 */
export function isRefunded(id: EventId, events: readonly Event[]): boolean {
  return blockersOfDelete(id, events).length > 0;
}

// ── 表單 → 事件 ───────────────────────────────────────────

export interface BuildContext {
  /** 新的一筆用；改一筆時用 existing 的 */
  readonly id: EventId;
  readonly me: PersonId;
  readonly now: number;
  /** 改一筆時：原本那則。id、recordedBy、recordedAt（規則不讓改）、一筆與品項的 ID（退款指著它們）、表單沒有的欄位都留著 */
  readonly existing?: Event;
}

function amountOf(form: RecordForm): number {
  const amount = parseAmount(form.amount);
  if (!amount.ok) throw new Error(amount.error); // 畫面存之前先 checkRecordForm
  return amount.value;
}

/** 事件的共同部分。名稱、時間空了要把欄位拿掉，不能留舊的。轉帳、對帳、退款的表單也用這個 */
export function eventBase(form: Pick<RecordForm, "title" | "date" | "time">, ctx: BuildContext): Omit<Event, "effects"> {
  const { effects: _effects, title: _title, time: _time, ...kept } = ctx.existing ?? {
    id: ctx.id,
    date: form.date,
    recordedBy: ctx.me,
    recordedAt: ctx.now,
    source: "manual" as const,
    status: "confirmed" as const,
    effects: [],
  };
  const title = form.title.trim();
  return { ...kept, date: form.date, ...(form.time === "" ? {} : { time: form.time }), ...(title === "" ? {} : { title }) };
}

const entryId = "m1" as EntryId;
const itemId = "i1" as ItemId;

export function buildExpense(form: RecordForm, ctx: BuildContext): Event {
  const amount = amountOf(form);
  const title = form.title.trim();
  const was = ctx.existing?.effects[0]?.kind === "expense" ? ctx.existing.effects[0] : undefined;
  const wasItem = was?.items[0];
  const { account: _account, ...entry } = was ?? { type: "money" as const, id: entryId, kind: "expense" as const };
  const { name: _name, ...item } = wasItem ?? { id: itemId };
  // 幫誰沒換就留原本的（裡面可能有進階的比例）
  const beneficiary: Beneficiary =
    was !== undefined && helpedOf(was.beneficiary) === form.helped
      ? was.beneficiary
      : form.helped === "shared"
        ? { kind: "shared" }
        : { kind: "person", person: form.helped };
  const expense: Expense = {
    ...entry,
    payer: form.person,
    ...(form.account === "" ? {} : { account: form.account }),
    amount,
    beneficiary,
    tags: form.tags,
    items: [{ ...item, ...(title === "" ? {} : { name: title }), amount, jar: form.jar, tags: [] }],
  };
  return { ...eventBase(form, ctx), effects: [expense] };
}

export function buildIncome(form: RecordForm, ctx: BuildContext): Event {
  const was = ctx.existing?.effects[0]?.kind === "income" ? ctx.existing.effects[0] : undefined;
  const { account: _account, ...entry } = was ?? { type: "money" as const, id: entryId, kind: "income" as const };
  const income: Income = {
    ...entry,
    person: form.person,
    ...(form.account === "" ? {} : { account: form.account }),
    amount: amountOf(form),
    tags: form.tags,
  };
  return { ...eventBase(form, ctx), effects: [income] };
}

/**
 * 存一筆要寫的東西（同一批）：事件，加上當場加的標籤（有選到的才存）、沒有日常時的日常。
 * 一次動作只寫一則事件。
 */
export function recordChanges(form: RecordForm, ctx: BuildContext & { readonly catalog: Catalog; readonly newTags: readonly Tag[] }): Changes {
  const event = form.kind === "expense" ? buildExpense(form, ctx) : buildIncome(form, ctx);
  const tags = ctx.newTags.filter((t) => form.tags.includes(t.id));
  const needsDaily = form.kind === "expense" && form.jar === DAILY_JAR && !ctx.catalog.jars.some((j) => j.id === DAILY_JAR);
  return {
    events: [event],
    ...(tags.length === 0 ? {} : { tags }),
    ...(needsDaily ? { jars: [dailyJar(ctx.catalog)] } : {}),
  };
}

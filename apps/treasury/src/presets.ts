// 預設資料（stage-1 issue 03）：帳戶、罐子、標籤、投入，從一個不進 repo 的檔案匯入一次，存進只有本人讀得到的文件；
// 一鍵重置不刪這份，重置後按一下「套用預設」就回來。這裡都是純函式，存讀在 store.ts。

import type {
  Account,
  AccountId,
  Amount,
  Event,
  EventId,
  Jar,
  JarId,
  LocalDate,
  PersonId,
  Reconciliation,
  Tag,
  Transfer,
} from "@baobu/core";
import { ENTRY_ID } from "./event-form";
import type { Changes } from "./store";

/** 日常罐的 ID：沒選罐子就算日常。05 沒有日常時也用它建，先記一筆再套用才不會有兩個日常 */
export const DAILY_JAR = "daily" as JarId;

/** 這則事件是不是套用預設時寫的（ID 固定是 preset- 開頭）：卡片牆「最常用的」不算它，那不是使用者用過 */
export const isPresetEvent = (id: EventId): boolean => id.startsWith("preset-");

/** 帳戶（現在只有台幣，幣別不用寫），加上要變成第一次對帳的餘額、要存進自己 prefs 的備註（只有匯入的人自己的帳戶才有這兩個） */
export interface PresetAccount extends Omit<Account, "currency" | "archived"> {
  /** 現在的餘額；信用卡是欠的，用負數 */
  readonly balance?: number;
  readonly note?: string;
}

/** 投入：從自己的帳戶轉進共有的投資帳戶（各自投入多少）。投資帳戶不對帳，所以用轉帳記 */
export interface PresetTransfer {
  readonly from: AccountId;
  readonly to: AccountId;
  readonly amount: Amount;
}

export interface Presets {
  /** 餘額、投入是哪一天的數字 */
  readonly asOf: LocalDate;
  readonly accounts: readonly PresetAccount[];
  readonly jars: readonly Jar[];
  /** 照這個順序：還沒有使用紀錄時，記帳畫面照它排 */
  readonly tags: readonly Tag[];
  readonly transfers: readonly PresetTransfer[];
}

export type ParseResult =
  | { readonly ok: true; readonly presets: Presets }
  | { readonly ok: false; readonly errors: readonly string[] };

const ACCOUNT_KINDS: readonly unknown[] = ["bank", "cash", "stored-value", "credit-card", "investment"];
/** 帳戶備註最多幾個字（檔案與畫面同一個） */
export const NOTE_MAX = 200;

type Row = Readonly<Record<string, unknown>>;

const isRow = (x: unknown): x is Row => typeof x === "object" && x !== null && !Array.isArray(x);
/** 能當文件 ID：不能有斜線、不能是 . 或 ..，規則限 40 字 */
const isId = (x: unknown): x is string => typeof x === "string" && /^(?!\.\.?$)[^/]{1,40}$/.test(x);
const isName = (x: unknown): x is string => typeof x === "string" && x.length >= 1 && x.length <= 40;

function isDate(x: unknown): x is LocalDate {
  if (typeof x !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return false;
  const [y, m, d] = x.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/**
 * 檢查從檔案讀出來的內容。me 是匯入的人，people 是王國裡的人。有錯就全部列出來（哪一列、什麼問題），什麼都不該寫。
 * 擋住的都是存進去會算錯、或會讓對方看到不該看的：
 * 別人的、共有的、投資的帳戶有餘額（對帳事件的參與者會多出別人，對方看得到實際餘額；投資帳戶不對帳）、非投資的共有帳戶（對帳會全算給記的人）。
 */
export function parsePresets(raw: unknown, me: PersonId, people: readonly PersonId[]): ParseResult {
  if (!isRow(raw)) return { ok: false, errors: ["檔案內容不是預設資料（要是一個物件，有 asOf、accounts、jars、tags、transfers）"] };

  const errors: string[] = [];
  for (const field of Object.keys(raw)) {
    if (!["asOf", "accounts", "jars", "tags", "transfers"].includes(field)) errors.push(`多了不認得的欄位 ${field}`);
  }
  if (!isDate(raw["asOf"])) errors.push("asOf（餘額是哪一天的數字）要是 YYYY-MM-DD");

  const accounts = rows(raw, "accounts", errors);
  const jars = rows(raw, "jars", errors);
  const tags = rows(raw, "tags", errors);
  const transfers = rows(raw, "transfers", errors);

  /** 這一列的主人；寫錯（沒有人、王國以外的人、重複）是 undefined */
  const validOwners = (row: Row): readonly PersonId[] | undefined => {
    const x = row["owners"];
    const ok = Array.isArray(x) && x.length >= 1 && x.length <= 2 && new Set(x).size === x.length && x.every((p) => people.includes(p as PersonId));
    return ok ? (x as PersonId[]) : undefined;
  };

  /** 一列的共同檢查：欄位都有、沒有不認得的欄位、ID 與名稱能用、ID 不重複。回傳記這一列問題的函式 */
  function common(label: string, row: Row, at: number, seen: Set<unknown>, required: readonly string[], optional: readonly string[] = []) {
    const here = `${label}第 ${at + 1} 列（${typeof row["name"] === "string" ? row["name"] : String(row["id"])}）`;
    const add = (message: string) => errors.push(`${here}：${message}`);
    for (const field of required) if (!(field in row)) add(`少了 ${field}`);
    for (const field of Object.keys(row)) if (!required.includes(field) && !optional.includes(field)) add(`多了不認得的欄位 ${field}`);
    if ("id" in row && !isId(row["id"])) add("id 要是 1 到 40 字、不能有斜線");
    else if ("id" in row && seen.has(row["id"])) add(`id ${String(row["id"])} 重複了`);
    seen.add(row["id"]);
    if ("name" in row && !isName(row["name"])) add("name 要是 1 到 40 字");
    if ("owners" in row && validOwners(row) === undefined) add("主人要是王國裡的人，一到兩個、不重複");
    return add;
  }

  const accountById = new Map<unknown, Row>();
  const seenAccounts = new Set<unknown>();
  accounts.forEach((row, at) => {
    const add = common("帳戶", row, at, seenAccounts, ["id", "name", "kind", "owners"], ["paidByOthers", "balance", "note"]);
    accountById.set(row["id"], row);
    const kind = row["kind"];
    const owners = validOwners(row);
    if ("kind" in row && !ACCOUNT_KINDS.includes(kind)) add(`kind 不認得（只有 ${ACCOUNT_KINDS.join("、")}）`);
    if (owners !== undefined && owners.length > 1 && kind !== "investment") add("共有的帳戶只能是投資（目前沒有共同帳戶）");
    if ("paidByOthers" in row && (row["paidByOthers"] !== true || kind === "investment")) add("paidByOthers 只能寫 true，而且不能是投資帳戶");
    const mine = owners?.length === 1 && owners[0] === me && kind !== "investment";
    if (owners !== undefined && !mine && ("balance" in row || "note" in row)) add("只有你自己的帳戶（不含共有、投資）才能寫餘額與備註");
    if ("balance" in row) {
      if (!Number.isSafeInteger(row["balance"])) add("餘額要是整數");
      else if (kind === "credit-card" && (row["balance"] as number) > 0) add("信用卡的餘額是欠的，要寫負數");
    }
    if ("note" in row && (typeof row["note"] !== "string" || row["note"].length > NOTE_MAX)) add(`備註要是 ${NOTE_MAX} 字以內的文字`);
  });

  const seenJars = new Set<unknown>();
  jars.forEach((row, at) => {
    const add = common("罐子", row, at, seenJars, ["id", "name", "owners"]);
    if (row["name"] === "日常" && row["id"] !== DAILY_JAR) add(`日常的 id 要是 ${DAILY_JAR}`);
  });
  if (Array.isArray(raw["jars"]) && !jars.some((row) => row["id"] === DAILY_JAR || row["name"] === "日常")) {
    errors.push(`要有日常這個罐子（id 是 ${DAILY_JAR}）`);
  }

  const seenTags = new Set<unknown>();
  tags.forEach((row, at) => void common("標籤", row, at, seenTags, ["id", "name"]));

  transfers.forEach((row, at) => {
    const add = (message: string) => errors.push(`投入第 ${at + 1} 列：${message}`);
    for (const field of ["from", "to", "amount"]) if (!(field in row)) add(`少了 ${field}`);
    for (const field of Object.keys(row)) if (!["from", "to", "amount"].includes(field)) add(`多了不認得的欄位 ${field}`);
    if ("amount" in row && !(Number.isSafeInteger(row["amount"]) && (row["amount"] as number) > 0)) add("金額要是正整數");
    if (!("from" in row && "to" in row)) return;
    const from = accountById.get(row["from"]);
    const to = accountById.get(row["to"]);
    if (from === undefined) add(`帳戶 ${String(row["from"])} 不在檔案裡`);
    if (to === undefined) add(`帳戶 ${String(row["to"])} 不在檔案裡`);
    if (from === undefined || to === undefined) return;
    const fromOwners = validOwners(from);
    const toOwners = validOwners(to);
    if (row["from"] === row["to"]) add("兩邊是同一個帳戶");
    else if (from["paidByOthers"] === true || to["paidByOthers"] === true) add("進出別人繳的帳戶是還款，不是投入");
    // 主人寫錯的那一列已經記過了，這裡不重複
    else if (fromOwners !== undefined && toOwners !== undefined && !fromOwners.some((o) => toOwners.includes(o))) add("兩邊要是同一個人（或共有）的帳戶");
  });

  return errors.length > 0 ? { ok: false, errors } : { ok: true, presets: raw as unknown as Presets };
}

/**
 * 套用預設要存的東西（給 store.ts 的 save，同一批，全部成功或全部失敗）：
 * - 帳戶（餘額、備註拿掉：帳戶文件成員都讀得到）、罐子、標籤用固定 ID。重置後寶的帳戶還在，同 ID 會覆蓋
 * - 每一筆投入一則轉帳，每個有餘額的帳戶一則對帳（第一次對帳就是初始餘額）。ID 固定，所以按兩次不會變兩倍：
 *   第二次 recordedAt 不同，規則不讓改，整批拒絕
 * - 對帳排在投入之後，初始餘額才會把投入轉出去的那段錢吸收掉。不合成一則：共有帳戶的事件對方看得到，步的實際餘額不能在裡面；
 *   流水頁一則一列，合在一起的話改或刪一次就動到所有帳戶
 * - 備註與標籤順序寫進我的 prefs
 */
export function presetChanges(presets: Presets, me: PersonId, now: number): Changes {
  const event = (id: string, title: string, recordedAt: number, effect: Transfer | Reconciliation): Event => ({
    id: id as EventId,
    date: presets.asOf,
    title,
    recordedBy: me,
    recordedAt,
    source: "manual",
    status: "confirmed",
    effects: [effect],
  });
  const entry = { type: "money", id: ENTRY_ID } as const;

  const transfers = presets.transfers.map((t, i) =>
    event(`preset-transfer-${i}`, "投入", now + i, { ...entry, kind: "transfer", from: t.from, to: t.to, amount: t.amount }),
  );
  const openings = presets.accounts
    .flatMap((a) => (a.balance === undefined ? [] : [{ account: a.id, actual: a.balance }]))
    .map(({ account, actual }, i) =>
      event(`preset-opening-${account}`, "初始餘額", now + transfers.length + i, { ...entry, kind: "reconciliation", account, actual }),
    );

  const notes = presets.accounts.flatMap((a) => (a.note === undefined ? [] : [[a.id, a.note] as const]));
  return {
    accounts: presets.accounts.map(({ balance: _balance, note: _note, ...account }) => ({ ...account, currency: "TWD" })),
    jars: presets.jars,
    tags: presets.tags,
    events: [...transfers, ...openings],
    prefs: {
      of: me,
      set: {
        tags: presets.tags.map((t) => t.id),
        // 沒有備註就不寫這一格：merge 時空的 map 會把原本的備註蓋掉
        ...(notes.length === 0 ? {} : { accountNotes: Object.fromEntries(notes) }),
      },
    },
  };
}

/** 取一個清單；不是清單或裡面有不是物件的列，記下問題、只回傳看得懂的列 */
function rows(raw: Row, field: string, errors: string[]): readonly Row[] {
  const list = raw[field];
  if (!Array.isArray(list)) {
    errors.push(`少了 ${field}（要是一個清單）`);
    return [];
  }
  list.forEach((row, at) => {
    if (!isRow(row)) errors.push(`${field} 第 ${at + 1} 列不是物件`);
  });
  return list.filter(isRow);
}

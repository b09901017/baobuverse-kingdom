// 帳本：從事件算出所有數字（docs/adr/0001：事件存原樣，數字讀的時候才算）。
// 這裡是介面與查詢；事件怎麼展開成一行一行在 ledger.ts。

import { asOf, type OpenDebt } from "./debts";
import { buildLedger } from "./ledger";
import type {
  AccountId,
  Amount,
  Catalog,
  DebtRef,
  EntryId,
  Event,
  EventId,
  ItemId,
  JarId,
  LocalDate,
  PersonId,
  TagId,
} from "./model";
import type { Problem } from "./validate";

/**
 * 數字的種類。都是「某個人的」：Query 沒給 person 就是看得到的所有人加起來。
 * 有正負號；存量（餘額、淨資產、往來帳、待收）是從第一天加到 `to`。
 *
 * - use 我用的：花在這個人身上的（幫自己的＋幫共的自己那一份），不管誰出、要不要還；罐子、標籤的統計都用它
 * - paid 我付的：從自己的錢出去的支出（含送人、直接給錢）；帳戶不知道的算自己的錢；刷寶媽卡的不算
 * - income 收入：含被寵時直接收到的錢；還款、退款不算
 * - tab 往來帳：正的是對方欠我。誰出和幫誰不同、要還的部分，加上還款
 * - receivable 待收：朋友還沒還我的
 * - spoilGiven 寵對方 · spoilReceived 被寵（cause 分得出買東西 spend 和直接給錢 giveMoney）
 * - balance 帳戶餘額：person 是帳戶的主人；共有帳戶是投入、拿出的那個人（所以也是「各自投入多少」）
 * - netWorth 淨資產：算進淨資產的那幾行 balance（寶媽卡不算；共有的投資帳戶只算自己投入的）
 * - reconcileDiff 對帳差額：實際比算出來多是正的；第一次對帳是初始餘額，不算差額
 */
export type Measure =
  | "use"
  | "paid"
  | "income"
  | "tab"
  | "receivable"
  | "spoilGiven"
  | "spoilReceived"
  | "balance"
  | "netWorth"
  | "reconcileDiff";

/** 這一行是哪一種一筆來的 */
export type Cause =
  | "spend" // 支出：買東西、付服務、送人
  | "giveMoney" // 支出裡的直接給錢（寵對方）
  | "income"
  | "transfer"
  | "repayment"
  | "refund"
  | "reconcile" // 對帳差額
  | "opening"; // 第一次對帳：初始餘額

/** 要不要還（我用的那幾行）：自己出的、別人出要還的、別人出不用還的（被寵） */
export type Repay = "self" | "repay" | "noRepay";

/** 還了沒（別人先出的那幾行）：沒有要還的、已經還的、還欠的；看的是 Query 的 `to` 那天 */
export type Settled = "none" | "repaid" | "outstanding";

/**
 * 視角：拆開來看的面向。每一行在每個面向上只有一個值，所以拆開的加起來等於總數。
 * 標籤可以多選，所以標籤是「有這個標籤／沒有」兩格（key 是 "with"、"without"）。
 */
export type Dimension =
  | "person"
  | "payer" // 誰出
  | "account"
  | "repay" // 要不要還
  | "jar"
  | "amortized" // 分期（按月攤）："yes"、"no"
  | "cause"
  | "counterpart" // 往來帳的另一個人
  | "settled"
  | "month" // YYYY-MM
  | { readonly tag: TagId }; // 固定花費、押金也是標籤

/** 篩選：每一個都要成立 */
export interface Where {
  readonly payer?: PersonId;
  readonly account?: AccountId;
  readonly jar?: JarId;
  readonly repay?: Repay;
  readonly amortized?: boolean;
  readonly cause?: Cause;
  readonly counterpart?: PersonId;
  readonly settled?: Settled;
  /** 這幾個標籤都要有（整筆的標籤也算，合併過的標籤當成合併後的那個） */
  readonly tags?: readonly TagId[];
  /** 有其中任何一個就不算（例如看統計時排除押金） */
  readonly withoutTags?: readonly TagId[];
}

export interface Query {
  readonly measure: Measure;
  /** 從誰的角度；沒給就是看得到的所有人加起來 */
  readonly person?: PersonId;
  /** 含這一天；沒給就是從第一天 */
  readonly from?: LocalDate;
  /** 含這一天；沒給就是到最後 */
  readonly to?: LocalDate;
  readonly where?: Where;
}

/**
 * 數字背後的一行（點一下展開時列出來的）。一個品項會變成好幾行：
 * 每個人的我用的各一行、按月攤每個月一行、往來帳一行…
 */
export interface Line {
  readonly measure: Measure;
  readonly person?: PersonId;
  /** 有正負號 */
  readonly amount: Amount;
  /** 算在哪一天（按月攤的每一份各有自己的日期） */
  readonly date: LocalDate;
  readonly event: EventId;
  readonly entry: EntryId;
  readonly item?: ItemId;
  readonly cause: Cause;
  readonly payer?: PersonId;
  readonly account?: AccountId;
  readonly jar?: JarId;
  /** 整筆的標籤已經套上、合併過的已經換掉 */
  readonly tags: readonly TagId[];
  readonly repay?: Repay;
  readonly amortized: boolean;
  readonly counterpart?: PersonId;
  readonly settled?: Settled;
}

export interface Bucket {
  /** 面向上的值：人、帳戶、罐子的 ID，或 "with"／"without"、"yes"／"no"、YYYY-MM… 沒有值的是 "none" */
  readonly key: string;
  readonly amount: Amount;
}

/** 要還的錢從哪裡來：步寶之間（往來帳）、別人繳的帳戶（寶媽卡）、朋友（待收） */
export type DebtChannel = "tab" | "othersCard" | "receivable";

export interface DebtQuery {
  readonly channel: DebtChannel;
  /** 欠錢或被欠的人 */
  readonly person?: PersonId;
  /** 寶媽卡是哪個帳戶 */
  readonly account?: AccountId;
  /** 算到這一天；沒給就是全部 */
  readonly asOf?: LocalDate;
  readonly outstandingOnly?: boolean;
}

/** 一筆要還的錢，跟它被抵掉了多少（還款、或往來帳裡之後反方向的支出） */
export interface Debt {
  readonly channel: DebtChannel;
  readonly ref: DebtRef;
  readonly date: LocalDate;
  /** 誰欠；朋友（待收）沒有 */
  readonly debtor?: PersonId;
  /** 欠誰；寶媽卡沒有（看 account） */
  readonly creditor?: PersonId;
  readonly account?: AccountId;
  readonly amount: Amount;
  readonly settled: Amount;
  readonly outstanding: Amount;
}

/** 算好的一本帳。同一本帳問幾次都一樣；事件變了就重新 openBook */
export interface Book {
  /** 一個數字 */
  total(query: Query): Amount;
  /** 視角：同一個數字依某個面向拆開，加起來等於 total(query)；金額是 0 的格子不列 */
  breakdown(query: Query, by: Dimension): readonly Bucket[];
  /** 數字背後的那幾行 */
  lines(query: Query): readonly Line[];
  /** 每一筆要還的錢已還多少、還欠多少（先抵最早的；手動指定的先抵指定的） */
  debts(query: DebtQuery): readonly Debt[];
  /** 沒算進去的事件和原因（例如品項加起來不等於整筆）。收件匣裡的不算問題，只是不入帳 */
  readonly problems: readonly Problem[];
}

/**
 * 打開帳本：把看得到的事件照時間排好（日期、時間（沒寫的排前面）、記下來的時間），從頭算一次。
 * 事件只要給看得到的就好：對方「幫自己付」的本來就不在裡面，也不影響自己的數字。
 * 收件匣裡的（pending）不算；有問題的事件不算、列在 problems。看不到的帳戶不算問題，只是沒有那個帳戶的餘額。
 */
export function openBook(catalog: Catalog, events: readonly Event[]): Book {
  const ledger = buildLedger(catalog, events);

  const expanded = new Map<string, readonly Line[]>();

  /**
   * 還了沒看的是 to 那天：別人先出的那幾行，照那一筆要還的錢到那天抵掉多少，依時間先後拆成已還、還欠兩段；
   * 退款（負的）算在還欠。
   */
  function withSettled(to: LocalDate | undefined): readonly Line[] {
    const cached = expanded.get(to ?? "");
    if (cached !== undefined) return cached;
    const left = new Map<OpenDebt, number>();
    const out: Line[] = [];
    for (const line of ledger.lines) {
      const debt = ledger.links.get(line);
      if (debt === undefined || line.amount < 0) {
        out.push(line);
        continue;
      }
      const available = left.get(debt) ?? asOf(debt, to).settled;
      const repaid = Math.min(line.amount, available);
      left.set(debt, available - repaid);
      if (repaid > 0) out.push({ ...line, amount: repaid, settled: "repaid" });
      if (line.amount > repaid) out.push({ ...line, amount: line.amount - repaid, settled: "outstanding" });
    }
    expanded.set(to ?? "", out);
    return out;
  }

  function select(query: Query): readonly Line[] {
    const w = query.where ?? {};
    const tags = w.tags?.map(ledger.tag) ?? [];
    const without = w.withoutTags?.map(ledger.tag) ?? [];
    // 存量從第一天加到 to
    const from = stocks.has(query.measure) ? undefined : query.from;
    return withSettled(query.to).filter(
      (line) =>
        line.measure === query.measure &&
        (query.person === undefined || line.person === query.person) &&
        (from === undefined || line.date >= from) &&
        (query.to === undefined || line.date <= query.to) &&
        (w.payer === undefined || line.payer === w.payer) &&
        (w.account === undefined || line.account === w.account) &&
        (w.jar === undefined || line.jar === w.jar) &&
        (w.repay === undefined || line.repay === w.repay) &&
        (w.amortized === undefined || line.amortized === w.amortized) &&
        (w.cause === undefined || line.cause === w.cause) &&
        (w.counterpart === undefined || line.counterpart === w.counterpart) &&
        (w.settled === undefined || (line.settled ?? "none") === w.settled) &&
        tags.every((t) => line.tags.includes(t)) &&
        !without.some((t) => line.tags.includes(t)),
    );
  }

  return {
    total: (query) => select(query).reduce((sum, line) => sum + line.amount, 0),
    breakdown: (query, by) => {
      const buckets = new Map<string, Amount>();
      const dimension = typeof by === "object" ? { tag: ledger.tag(by.tag) } : by;
      for (const line of select(query)) {
        const key = keyOf(line, dimension);
        buckets.set(key, (buckets.get(key) ?? 0) + line.amount);
      }
      return [...buckets]
        .filter(([, amount]) => amount !== 0)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, amount]) => ({ key, amount }));
    },
    lines: select,
    debts: (query) => ledger.debts.list(query),
    problems: ledger.problems,
  };
}

const stocks = new Set<Measure>(["balance", "netWorth", "tab", "receivable"]);

/** 一行在某個面向上的值；沒有值的是 "none" */
function keyOf(line: Line, by: Dimension): string {
  if (typeof by === "object") return line.tags.includes(by.tag) ? "with" : "without";
  switch (by) {
    case "amortized":
      return line.amortized ? "yes" : "no";
    case "month":
      return line.date.slice(0, 7);
    case "cause":
      return line.cause;
    default:
      return line[by] ?? "none";
  }
}

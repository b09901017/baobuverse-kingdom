// 存起來的資料長什麼樣子（docs/adr/0001）。只有形狀，數字怎麼算在 book.ts。
// 名詞以 GLOSSARY.md 為準，程式裡的名字對照：
//
//   人 Person · 帳戶 Account · 罐子 Jar · 標籤 Tag · 固定花費 Recurring
//   事件 Event · 效果 Effect · 一筆 MoneyEffect
//     支出 Expense · 收入 Income · 轉帳 Transfer · 還款 Repayment · 對帳 Reconciliation · 退款 Refund
//   品項 Item · 誰出 payer · 幫誰 beneficiary（共 shared） · 不用還 noRepay
//   待收 receivable · 按月攤 amortize · 直接給錢 cash · 寶媽卡 paidByOthers 的帳戶
//   收件匣 status "pending" · 有疑問 doubts · 封存 archived

declare const brand: unique symbol;
type Id<Kind extends string> = string & { readonly [brand]: Kind };

export type PersonId = Id<"Person">;
export type AccountId = Id<"Account">;
export type JarId = Id<"Jar">;
export type TagId = Id<"Tag">;
export type RecurringId = Id<"Recurring">;
export type EventId = Id<"Event">;
/** 一則事件裡的一筆。只要在同一則事件裡不重複 */
export type EntryId = Id<"Entry">;
/** 一筆裡的一個品項。只要在同一筆裡不重複 */
export type ItemId = Id<"Item">;

/** 金額：最小單位的整數（台幣就是元），不用小數。幣別看帳戶；沒有帳戶的是台幣 */
export type Amount = number;
/** 現在只有台幣；外幣（之後）再加 */
export type Currency = "TWD";
/** 當地的日期 `YYYY-MM-DD` */
export type LocalDate = string;
/** 當地的時間 `HH:mm` */
export type LocalTime = string;

// ── 參考資料 ──────────────────────────────────────────────

/** 人：步或寶。跟登入帳號分開：哪個登入帳號是哪個人，是 app 那一層的事 */
export interface Person {
  readonly id: PersonId;
  readonly name: string;
}

export type AccountKind = "bank" | "cash" | "stored-value" | "credit-card" | "investment";

/** 帳戶。卡片牆的排序是每個人自己的偏好，不放這裡 */
export interface Account {
  readonly id: AccountId;
  readonly name: string;
  readonly note?: string;
  readonly kind: AccountKind;
  /** 一個人，或兩人共有（共有的投資帳戶） */
  readonly owners: readonly PersonId[];
  readonly currency: Currency;
  /** 別人繳的帳戶（寶媽卡）：不算進淨資產、刷它不算我付的、還它是還款不是轉帳 */
  readonly paidByOthers?: true;
  readonly archived?: true;
}

/**
 * 罐子。品項只有一個罐子：共付的品項，每個人那一份都算在自己的這個罐子
 * （共付的日常：步那一份算步的日常、寶那一份算寶的日常）。
 */
export interface Jar {
  readonly id: JarId;
  readonly name: string;
  /** 誰的預算裡有這個罐子（例如冥想只有寶） */
  readonly owners: readonly PersonId[];
  readonly archived?: true;
}

export interface Tag {
  readonly id: TagId;
  readonly name: string;
  /** 記帳選了這個標籤時預設帶的罐子（高級吃吃帶玩玩）。只在記的時候帶，改了不影響記過的 */
  readonly defaultJar?: JarId;
  /** 合併進另一個標籤（7-11 併進 711）：記過的事件不用改，算的時候當成那一個 */
  readonly mergedInto?: TagId;
  readonly archived?: true;
}

/** 固定花費的範本：到期時產生一則收件匣裡的事件（階段 5），按一下確認才入帳 */
export interface Recurring {
  readonly id: RecurringId;
  /** 誰設定的；也是誰出、到期進誰的收件匣 */
  readonly owner: PersonId;
  readonly name: string;
  /** 大約金額，確認時可以改 */
  readonly amount: Amount;
  readonly every: "month" | "year";
  /** 幾號；那個月沒有這天就用月底 */
  readonly day: number;
  /** 每年的話是幾月（1–12） */
  readonly month?: number;
  readonly account: AccountId;
  readonly beneficiary: Beneficiary;
  readonly jar: JarId;
  readonly tags: readonly TagId[];
  /** 年繳按月攤 */
  readonly amortize?: Amortize;
  readonly archived?: true;
}

/** core 算數字時要的參考資料。帳戶只放看得到的：對方的帳戶不在裡面也沒關係 */
export interface Catalog {
  readonly people: readonly Person[];
  readonly accounts: readonly Account[];
  readonly jars: readonly Jar[];
  readonly tags: readonly Tag[];
}

// ── 事件 ──────────────────────────────────────────────────

export type EventSource = "manual" | "voice" | "notification" | "recurring";
/** pending：收件匣裡還沒確認的，不入帳，任何數字都不算 */
export type EventStatus = "confirmed" | "pending";

/**
 * 事件：一次動作的紀錄，一次動作只寫一則。誰看得到它（參與者）從內容算，見 participantsOf；
 * 只有記的人能改，看得到的其他人只能標有疑問。
 */
export interface Event {
  readonly id: EventId;
  /** 事件發生那天（當地的日期）。日記就是查同一天的事件 */
  readonly date: LocalDate;
  readonly time?: LocalTime;
  /** 名稱，也是日記上的那一行；只有一個品項時就是那一項的名稱 */
  readonly title?: string;
  readonly note?: string;
  readonly recordedBy: PersonId;
  /** 記下來的時間（毫秒）。同一天同一個時間的事件照這個排先後 */
  readonly recordedAt: number;
  readonly source: EventSource;
  readonly status: EventStatus;
  /** 通知的外部 ID：同一筆的好幾則通知合併在同一則事件 */
  readonly externalIds?: readonly string[];
  /** 從哪個固定花費範本產生的 */
  readonly recurring?: RecurringId;
  /** 有疑問：key 是標記的人的 PersonId（存成 map，規則才好限制每個人只改自己那一格） */
  readonly doubts?: Readonly<Record<string, Doubt>>;
  readonly effects: readonly Effect[];
}

export interface Doubt {
  readonly note?: string;
  readonly at: number;
}

/** 效果：事件帶來的一個結果。現在只有錢；之後加物品、日記的一行，各自一個 type */
export type Effect = MoneyEffect;

/** 一筆：一次付錢、收錢、轉帳、還錢、對帳或退款 */
export type MoneyEffect = Expense | Income | Transfer | Repayment | Reconciliation | Refund;

interface MoneyBase {
  readonly type: "money";
  readonly id: EntryId;
}

/** 幫誰。共＝王國裡所有的人，沒寫比例就平分 */
export type Beneficiary =
  | { readonly kind: "person"; readonly person: PersonId }
  | { readonly kind: "shared"; readonly weights?: readonly Weight[] };

/** 進階：比例不是 5:5（例如步 6、寶 4） */
export interface Weight {
  readonly person: PersonId;
  readonly weight: number;
}

/** 按月攤：從付錢那個月開始，平均攤到幾個月（2 以上） */
export interface Amortize {
  readonly months: number;
}

/** 直接給錢（寵對方）：對方收到的是錢，算對方的收入，不算對方的我用的 */
export interface CashGift {
  /** 對方收錢的帳戶；不知道就空著 */
  readonly into?: AccountId;
}

/** 支出。整筆有預設，品項可以各自改 */
export interface Expense extends MoneyBase {
  readonly kind: "expense";
  readonly payer: PersonId;
  /** 錢從哪個帳戶出去。對方付的、不知道是哪個帳戶就空著：那就不動任何帳戶的餘額 */
  readonly account?: AccountId;
  /** 整筆的金額，等於品項加起來 */
  readonly amount: Amount;
  /** 幫誰（整筆的預設） */
  readonly beneficiary: Beneficiary;
  /** 不用還（整筆的預設）；沒寫就是要還 */
  readonly noRepay?: boolean;
  /** 整筆的標籤：算的時候套到每一項，不會重複算 */
  readonly tags: readonly TagId[];
  /** 至少一項；只有一項時畫面上看不出品項 */
  readonly items: readonly Item[];
}

export interface Item {
  readonly id: ItemId;
  readonly name?: string;
  readonly amount: Amount;
  readonly jar: JarId;
  readonly tags: readonly TagId[];
  /** 進階：這一項幫的人跟整筆不同 */
  readonly beneficiary?: Beneficiary;
  /** 進階：這一項要不要還跟整筆不同 */
  readonly noRepay?: boolean;
  /** 進階：有人要還我（待收），這一項裡朋友要還的部分；剩下的才照幫誰分 */
  readonly receivable?: Amount;
  readonly amortize?: Amortize;
  /** 只能用在幫對方、不用還的品項 */
  readonly cash?: CashGift;
}

/** 收入。不分罐子 */
export interface Income extends MoneyBase {
  readonly kind: "income";
  readonly person: PersonId;
  readonly account?: AccountId;
  readonly amount: Amount;
  readonly tags: readonly TagId[];
}

/** 轉帳：同一個人（或共有）的兩個帳戶之間。進出寶媽卡的不是轉帳，是還款 */
export interface Transfer extends MoneyBase {
  readonly kind: "transfer";
  readonly from: AccountId;
  readonly to: AccountId;
  /** 從 from 出去的金額（from 的幣別） */
  readonly amount: Amount;
  /** 進到 to 的金額（to 的幣別）；換匯時才不一樣，沒寫就等於 amount */
  readonly amountIn?: Amount;
  readonly tags?: readonly TagId[];
}

/** 還款的一邊 */
export type RepaymentParty =
  /** 步或寶；帳戶不知道就空著 */
  | { readonly kind: "person"; readonly person: PersonId; readonly account?: AccountId }
  /** 別人繳的帳戶（寶媽卡）：還寶媽 */
  | { readonly kind: "othersAccount"; readonly account: AccountId }
  /** 朋友（待收） */
  | { readonly kind: "outside" };

/**
 * 還款：寶還步、步還寶（往來帳）、寶還寶媽（寶媽卡）、朋友還自己（待收）。不綁品項：
 * 先抵最早還沒還清的；進階可以手動指定抵哪幾筆，剩下的再抵最早的。
 */
export interface Repayment extends MoneyBase {
  readonly kind: "repayment";
  readonly amount: Amount;
  readonly from: RepaymentParty;
  readonly to: RepaymentParty;
  readonly allocations?: readonly Allocation[];
  readonly tags?: readonly TagId[];
}

export interface Allocation {
  readonly target: DebtRef;
  readonly amount: Amount;
}

/** 對帳：看著實際餘額輸入。每個帳戶的第一次對帳就是初始餘額 */
export interface Reconciliation extends MoneyBase {
  readonly kind: "reconciliation";
  readonly account: AccountId;
  /** 實際餘額；信用卡、寶媽卡是欠的，用負數 */
  readonly actual: number;
}

/** 退款：商家退回的錢，沖回原本那一項 */
export interface Refund extends MoneyBase {
  readonly kind: "refund";
  readonly target: ItemRef;
  readonly amount: Amount;
  /** 錢退回哪個帳戶；沒寫就是原本那一筆的帳戶 */
  readonly account?: AccountId;
}

/** 指到某則事件的某一筆的某一項 */
export interface ItemRef {
  readonly event: EventId;
  readonly entry: EntryId;
  readonly item: ItemId;
}

/** 一筆要還的錢：通常是某一項；沒有 item 是還款多還、變成反方向的那一段 */
export interface DebtRef {
  readonly event: EventId;
  readonly entry: EntryId;
  readonly item?: ItemId;
}

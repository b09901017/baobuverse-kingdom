// 預設資料（stage-1 issue 03）。金額、名稱都是假的：真實資料只放 .local，不進 repo。

import { openBook, participantsOf, validateEvent, type AccountId, type Catalog, type Event, type PersonId } from "@baobu/core";
import { describe, expect, it } from "vitest";
import { DAILY_JAR, parsePresets, presetChanges, type Presets } from "../src/presets";

const 步 = "bu" as PersonId;
const 寶 = "bao" as PersonId;
const 王國的人 = [步, 寶];

const 假銀行 = "a-bank" as AccountId;
const 假錢包 = "a-wallet" as AccountId;
const 寶的假銀行 = "b-bank" as AccountId;
const 假投資 = "shared" as AccountId;

/** 一份對的檔案（假資料）。每個錯的情況從這裡改一個地方 */
const 檔案 = () => ({
  asOf: "2026-10-01",
  accounts: [
    { id: 假錢包, name: "假錢包", kind: "cash", owners: [步], balance: 1111 },
    { id: 假銀行, name: "假銀行", kind: "bank", owners: [步], note: "假備註", balance: 22222 },
    { id: "a-card", name: "假信用卡", kind: "credit-card", owners: [步], balance: -333 },
    { id: 寶的假銀行, name: "寶的假銀行", kind: "bank", owners: [寶] },
    { id: "b-mom", name: "假寶媽卡", kind: "credit-card", owners: [寶], paidByOthers: true },
    { id: 假投資, name: "假投資", kind: "investment", owners: [步, 寶] },
  ] as Record<string, unknown>[],
  jars: [
    { id: DAILY_JAR, name: "日常", owners: [步, 寶] },
    { id: "j-mine", name: "假罐子", owners: [步] },
  ] as Record<string, unknown>[],
  tags: [
    { id: "t-2", name: "假標籤二" },
    { id: "t-1", name: "假標籤一" },
  ] as Record<string, unknown>[],
  transfers: [
    { from: 假銀行, to: 假投資, amount: 4000 },
    { from: 寶的假銀行, to: 假投資, amount: 700 },
  ] as Record<string, unknown>[],
});

const parse = (raw: unknown) => parsePresets(raw, 步, 王國的人);

/** 改一個地方之後的錯誤；應該只有一條 */
function 只有一個錯(raw: unknown): string {
  const result = parse(raw);
  if (result.ok) throw new Error("應該要擋下來");
  expect(result.errors).toHaveLength(1);
  return result.errors[0] as string;
}

function 第幾列改(list: "accounts" | "jars" | "tags" | "transfers", at: number, patch: Record<string, unknown>) {
  const file = 檔案();
  file[list][at] = { ...file[list][at], ...patch };
  return file;
}

function 拿掉欄位(list: "accounts" | "jars" | "tags" | "transfers", at: number, field: string) {
  const file = 檔案();
  const { [field]: _removed, ...rest } = file[list][at] as Record<string, unknown>;
  file[list][at] = rest;
  return file;
}

/** 假資料裡步的數字：假錢包 1,111、假銀行 22,222、假信用卡 −333；投入：步 4,000、寶 700 */
function 套用(now = 1_000_000) {
  const result = parse(檔案());
  if (!result.ok) throw new Error(result.errors.join("\n"));
  const presets: Presets = result.presets;
  const changes = presetChanges(presets, 步, now);
  const catalog: Catalog = {
    people: 王國的人.map((id) => ({ id, name: id })),
    accounts: changes.accounts ?? [],
    jars: changes.jars ?? [],
    tags: changes.tags ?? [],
  };
  const events: readonly Event[] = changes.events ?? [];
  return { changes, catalog, events, book: openBook(catalog, events) };
}

describe("presetChanges：帳本的數字", () => {
  it("每個自己的帳戶餘額是檔案寫的那個數字（投入從假銀行轉出去，第一次對帳把那段吸收掉）", () => {
    const { book } = 套用();
    const 餘額 = (id: string) => book.total({ measure: "balance", where: { account: id as AccountId } });
    expect(餘額(假錢包)).toBe(1111);
    expect(餘額(假銀行)).toBe(22222);
    expect(餘額("a-card")).toBe(-333);
    expect(book.problems).toEqual([]);
  });

  it("共有帳戶的步、寶投入是各自那個數字，加起來是總數", () => {
    const { book } = 套用();
    const 投入 = (person: PersonId) => book.total({ measure: "balance", person, where: { account: 假投資 } });
    expect(投入(步)).toBe(4000);
    expect(投入(寶)).toBe(700);
    expect(book.total({ measure: "balance", where: { account: 假投資 } })).toBe(4700);
  });

  it("步的淨資產＝自己帳戶加起來＋自己投入的；寶投入的、寶的帳戶負的那段都不算進去", () => {
    const { book } = 套用();
    expect(book.total({ measure: "netWorth", person: 步 })).toBe(1111 + 22222 - 333 + 4000);
    // 寶的假銀行沒有第一次對帳：投入之後是負的，算在寶身上
    expect(book.total({ measure: "balance", person: 寶, where: { account: 寶的假銀行 } })).toBe(-700);
    expect(book.total({ measure: "netWorth", person: 寶 })).toBe(0);
  });

  it("投入的轉帳不算支出：我用的、我付的、收入都是 0（README 第一條）", () => {
    const { book } = 套用();
    for (const person of 王國的人) {
      for (const measure of ["use", "paid", "income", "tab"] as const) expect(book.total({ measure, person })).toBe(0);
    }
  });

  it("第一次對帳不算對帳差額：0 筆差額，餘額是 opening", () => {
    const { book } = 套用();
    expect(book.lines({ measure: "reconcileDiff" })).toEqual([]);
    expect(book.total({ measure: "balance", where: { account: 假錢包, cause: "opening" } })).toBe(1111);
  });
});

describe("presetChanges：事件", () => {
  const 對帳 = (events: readonly Event[]) => events.filter((e) => e.effects.some((m) => m.kind === "reconciliation"));
  const 轉帳 = (events: readonly Event[]) => events.filter((e) => e.effects.some((m) => m.kind === "transfer"));

  it("每一筆投入一則、每個有餘額的帳戶一則（改或刪一則不會動到別的帳戶）；每一則只有一筆", () => {
    const { events } = 套用();
    expect(轉帳(events)).toHaveLength(2);
    expect(對帳(events)).toHaveLength(3);
    expect(events).toHaveLength(5);
    for (const e of events) expect(e.effects).toHaveLength(1);
  });

  it("都過得了 core 的檢查", () => {
    const { catalog, events } = 套用();
    for (const e of events) expect(validateEvent(e, catalog, [])).toEqual([]);
  });

  it("ID 固定：再算一次（時間不同）ID 一樣、recordedAt 不同", () => {
    const 第一次 = 套用(1000).events;
    const 第二次 = 套用(2000).events;
    expect(第二次.map((e) => e.id)).toEqual(第一次.map((e) => e.id));
    expect(new Set(第一次.map((e) => e.id)).size).toBe(第一次.length);
    第一次.forEach((e, i) => expect(第二次[i]?.recordedAt).not.toBe(e.recordedAt));
  });

  it("第一次對帳排在投入之後；日期是檔案的 asOf；記的人是我", () => {
    const { events } = 套用();
    const 投入最晚 = Math.max(...轉帳(events).map((e) => e.recordedAt));
    for (const e of 對帳(events)) expect(e.recordedAt).toBeGreaterThan(投入最晚);
    for (const e of events) {
      expect(e.date).toBe("2026-10-01");
      expect(e.recordedBy).toBe(步);
      expect(e.status).toBe("confirmed");
    }
  });

  it("每一則初始餘額的參與者只有步；投入是兩個人，但事件裡沒有步帳戶的實際餘額", () => {
    const { catalog, events } = 套用();
    for (const e of 對帳(events)) expect(participantsOf(e, catalog, events)).toEqual([步]);
    for (const e of 轉帳(events)) {
      expect(participantsOf(e, catalog, events)).toEqual([寶, 步]);
      const text = JSON.stringify(e);
      for (const 實際餘額 of [1111, 22222, 333]) expect(text).not.toContain(String(實際餘額));
    }
  });
});

describe("presetChanges：參考資料與自己的 prefs", () => {
  it("帳戶文件沒有餘額、沒有備註（這兩個不能進成員都讀得到的文件）", () => {
    const { changes } = 套用();
    for (const account of changes.accounts ?? []) {
      expect(account).not.toHaveProperty("balance");
      expect(account).not.toHaveProperty("note");
    }
    expect(changes.accounts?.map((a) => a.id)).toEqual(檔案().accounts.map((a) => a["id"]));
    expect(changes.accounts?.find((a) => a.id === "b-mom")?.paidByOthers).toBe(true);
  });

  it("備註與標籤順序寫進我的 prefs", () => {
    const { changes } = 套用();
    expect(changes.prefs).toEqual({ of: 步, set: { tags: ["t-2", "t-1"], accountNotes: { [假銀行]: "假備註" } } });
    expect(changes.tags?.map((t) => t.id)).toEqual(["t-2", "t-1"]);
  });
});

describe("parsePresets：對的檔案", () => {
  it("過得了，內容跟檔案一樣（標籤的順序也一樣）", () => {
    const result = parse(檔案());
    if (!result.ok) throw new Error(result.errors.join("\n"));
    expect(result.presets).toEqual(檔案());
    expect(result.presets.tags.map((t) => t.id)).toEqual(["t-2", "t-1"]);
  });

  it("沒有投入、沒有標籤也可以；餘額是 0 也算有寫", () => {
    const file = { ...檔案(), transfers: [], tags: [] };
    file.accounts[0] = { ...file.accounts[0], balance: 0 };
    expect(parse(file).ok).toBe(true);
  });
});

describe("parsePresets：錯的檔案要講清楚哪一列、什麼問題", () => {
  it("不是物件", () => {
    for (const raw of [null, 1, "x", []]) expect(只有一個錯(raw)).toContain("不是預設資料");
  });

  it("少了整個清單", () => {
    const { tags: _tags, ...沒有標籤 } = 檔案();
    expect(只有一個錯(沒有標籤)).toContain("tags");
  });

  it("多了不認得的欄位（打錯字不會被默默丟掉）", () => {
    expect(只有一個錯({ ...檔案(), extra: 1 })).toContain("extra");
    expect(只有一個錯(第幾列改("accounts", 0, { balence: 1 }))).toBe("帳戶第 1 列（假錢包）：多了不認得的欄位 balence");
  });

  it("日期格式不對", () => {
    for (const asOf of ["10/01", "2026-13-01", "2026-02-30", 20261001]) {
      expect(只有一個錯({ ...檔案(), asOf })).toContain("asOf");
    }
  });

  describe("帳戶", () => {
    it.each([
      ["id", "帳戶第 1 列（假錢包）：少了 id"],
      ["name", "帳戶第 1 列（a-wallet）：少了 name"],
      ["kind", "帳戶第 1 列（假錢包）：少了 kind"],
      ["owners", "帳戶第 1 列（假錢包）：少了 owners"],
    ])("少欄位：%s", (field, message) => {
      expect(只有一個錯(拿掉欄位("accounts", 0, field))).toBe(message);
    });

    it("ID 要能當文件 ID、不重複", () => {
      expect(只有一個錯(第幾列改("accounts", 0, { id: "a/b" }))).toContain("id");
      expect(只有一個錯(第幾列改("accounts", 0, { id: ".." }))).toContain("id");
      expect(只有一個錯(第幾列改("accounts", 0, { id: "x".repeat(41) }))).toContain("id");
      expect(只有一個錯(第幾列改("accounts", 0, { id: 假銀行 }))).toContain("重複");
    });

    it("名稱太長、種類不認得", () => {
      expect(只有一個錯(第幾列改("accounts", 0, { name: "x".repeat(41) }))).toContain("name");
      expect(只有一個錯(第幾列改("accounts", 0, { kind: "stock" }))).toContain("kind");
    });

    it("主人沒有人、有王國以外的人、重複、不是清單", () => {
      expect(只有一個錯(第幾列改("accounts", 3, { owners: [] }))).toContain("主人");
      expect(只有一個錯(第幾列改("accounts", 3, { owners: ["friend"] }))).toContain("主人");
      expect(只有一個錯(第幾列改("accounts", 3, { owners: [寶, 寶] }))).toContain("主人");
      expect(只有一個錯(第幾列改("accounts", 3, { owners: 寶 }))).toContain("主人");
    });

    it("金額不是整數", () => {
      expect(只有一個錯(第幾列改("accounts", 0, { balance: 12.5 }))).toBe("帳戶第 1 列（假錢包）：餘額要是整數");
      expect(只有一個錯(第幾列改("accounts", 0, { balance: "100" }))).toBe("帳戶第 1 列（假錢包）：餘額要是整數");
    });

    it("信用卡的餘額是欠的，要寫負數", () => {
      expect(只有一個錯(第幾列改("accounts", 2, { balance: 333 }))).toContain("負數");
    });

    it("別人的、共有的、投資的帳戶不能有餘額與備註（不然對帳事件的參與者會多出別人，對方看得到實際餘額）", () => {
      for (const patch of [{ balance: 100 }, { note: "x" }]) {
        expect(只有一個錯(第幾列改("accounts", 3, patch))).toContain("只有你自己的帳戶");
        expect(只有一個錯(第幾列改("accounts", 5, patch))).toContain("只有你自己的帳戶");
        expect(只有一個錯(第幾列改("accounts", 1, { ...patch, kind: "investment" }))).toContain("只有你自己的帳戶");
      }
    });

    it("共有的帳戶只能是投資（目前沒有共同帳戶；非投資的共有帳戶，對帳會全算給記的人）", () => {
      const file = 第幾列改("accounts", 5, { kind: "bank" });
      expect(只有一個錯(file)).toContain("共有");
    });

    it("paidByOthers 只能是 true，而且不能是投資帳戶", () => {
      expect(只有一個錯(第幾列改("accounts", 4, { paidByOthers: false }))).toContain("paidByOthers");
      expect(只有一個錯({ ...第幾列改("accounts", 5, { paidByOthers: true }), transfers: [] })).toContain("paidByOthers");
    });

    it("備註太長、不是字串", () => {
      expect(只有一個錯(第幾列改("accounts", 1, { note: "x".repeat(201) }))).toContain("備註");
      expect(只有一個錯(第幾列改("accounts", 1, { note: 1 }))).toContain("備註");
    });
  });

  describe("罐子", () => {
    it("要有日常，而且 ID 是定好的那個（先記一筆再套用才不會有兩個日常）", () => {
      expect(只有一個錯({ ...檔案(), jars: [{ id: "j-mine", name: "假罐子", owners: [步] }] })).toContain("日常");
      expect(只有一個錯(第幾列改("jars", 0, { id: "other-daily" }))).toContain(DAILY_JAR);
    });

    it("少欄位、主人沒有人、ID 重複", () => {
      expect(只有一個錯(拿掉欄位("jars", 1, "name"))).toContain("name");
      expect(只有一個錯(第幾列改("jars", 1, { owners: [] }))).toContain("主人");
      expect(只有一個錯(第幾列改("jars", 1, { id: DAILY_JAR, name: "另一個" }))).toContain("重複");
    });
  });

  describe("標籤", () => {
    it("少欄位、ID 重複、帶預設罐子（預設的標籤都不帶）", () => {
      expect(只有一個錯(拿掉欄位("tags", 0, "name"))).toContain("name");
      expect(只有一個錯(第幾列改("tags", 0, { id: "t-1" }))).toContain("重複");
      expect(只有一個錯(第幾列改("tags", 0, { defaultJar: DAILY_JAR }))).toContain("defaultJar");
    });
  });

  describe("投入", () => {
    it("金額不是正整數", () => {
      for (const amount of [0, -1, 1.5, "1"]) {
        expect(只有一個錯(第幾列改("transfers", 0, { amount }))).toBe("投入第 1 列：金額要是正整數");
      }
    });

    it("帳戶不在檔案裡、同一個帳戶", () => {
      expect(只有一個錯(第幾列改("transfers", 0, { from: "nope" }))).toContain("nope");
      expect(只有一個錯(第幾列改("transfers", 0, { to: 假銀行 }))).toContain("同一個帳戶");
    });

    it("轉帳兩邊不同人：步的帳戶轉到寶的帳戶（那是還款）", () => {
      expect(只有一個錯(第幾列改("transfers", 0, { to: 寶的假銀行 }))).toContain("同一個人");
    });

    it("進出寶媽卡（那是還款）", () => {
      expect(只有一個錯(第幾列改("transfers", 1, { to: "b-mom" }))).toContain("還款");
    });
  });

  it("好幾個錯一次列出來", () => {
    const file = 第幾列改("accounts", 0, { balance: 1.5 });
    file.transfers[0] = { ...file.transfers[0], amount: 0 };
    const result = parse(file);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toHaveLength(2);
  });
});

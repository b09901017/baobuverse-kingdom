// Fuzz: every op goes through the same form helpers + validateEvent the screens use. Only fake data.
import { blockersOfDelete, openBook, participantsOf, refundsOf, validateEvent, type Account, type AccountId, type Catalog, type Event, type EventId, type JarId, type PersonId, type TagId } from "@baobu/core";
import { accountOptions, buildExpense, buildIncome, checkRecordForm, defaultForm, formOf, jarOptions, withHelped, withPerson, recordChanges, type RecordForm } from "@repo/record";
import { sourceOptions, targetOptions, withSource, defaultTransfer, buildTransfer, transferFormOf, checkTransferForm } from "@repo/transfer";
import { buildReconciliation, checkReconcileForm, defaultReconcile, reconcileFormOf, reconcilePreview } from "@repo/reconcile";
import { buildRefund, checkRefundForm, defaultRefund, refundAccountOptions, refundFormOf, refundTargetAt, refundTargetOf, refundable } from "@repo/refund";
import { flowDays } from "@repo/flow";
import { DAILY_JAR } from "@repo/presets";

const 步 = "bu" as PersonId;
const 寶 = "bao" as PersonId;
const acc = (id: string, kind: Account["kind"], owners: PersonId[], extra: Partial<Account> = {}): Account => ({ id: id as AccountId, name: "假" + id, kind, owners, currency: "TWD", ...extra });

function freshCatalog(): Catalog {
  return {
    people: [{ id: 步, name: "步" }, { id: 寶, name: "寶" }],
    accounts: [
      acc("bu-cash", "cash", [步]),
      acc("bu-bank", "bank", [步]),
      acc("bu-bank2", "bank", [步]),
      acc("bu-card", "credit-card", [步]),
      acc("bu-stored", "stored-value", [步]),
      acc("bu-inv", "investment", [步]),
      acc("bu-mom", "credit-card", [步], { paidByOthers: true }),
      acc("bao-cash", "cash", [寶]),
      acc("bao-bank", "bank", [寶]),
      acc("bao-card", "credit-card", [寶]),
      acc("bao-mom", "credit-card", [寶], { paidByOthers: true }),
      acc("shared-inv", "investment", [步, 寶]),
      acc("shared-inv2", "investment", [步, 寶]),
    ],
    jars: [
      { id: DAILY_JAR, name: "日常", owners: [步, 寶] },
      { id: "play" as JarId, name: "玩玩", owners: [步, 寶] },
      { id: "med" as JarId, name: "冥想", owners: [寶] },
      { id: "free" as JarId, name: "自由", owners: [步] },
    ],
    tags: [{ id: "t1" as TagId, name: "假1" }, { id: "t2" as TagId, name: "假2" }],
  };
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Doc { event: Event; participants: readonly PersonId[]; deleted: boolean }
const accepted: Record<string, number> = {};
const rejected: Record<string, number> = {};

const MEASURES = ["use", "paid", "income", "tab", "receivable", "spoilGiven", "spoilReceived", "balance", "netWorth", "reconcileDiff"] as const;

function run(seed: number, opsCount: number, findings: Map<string, { count: number; sample: string }>) {
  const r = rng(seed);
  const pick = <T,>(xs: readonly T[]): T | undefined => xs[Math.floor(r() * xs.length)];
  const catalog = { value: freshCatalog() };
  const docs = new Map<string, Doc>();
  let clock = 1_000_000;
  let nextId = 0;
  const log: string[] = [];
  const note = (key: string, detail: string) => {
    const f = findings.get(key);
    if (f === undefined) findings.set(key, { count: 1, sample: `seed ${seed}: ${detail}\n   last ops: ${log.slice(-6).join(" | ")}` });
    else f.count += 1;
  };
  const live = () => [...docs.values()].filter((d) => !d.deleted);
  const visible = (p: PersonId) => live().filter((d) => d.participants.includes(p)).map((d) => d.event);
  const allEvents = () => live().map((d) => d.event);
  const dates = ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-05", "2026-10-08"];
  const times = ["", "", "09:00", "12:00", "12:00", "18:00"];
  const amount = () => String(1 + Math.floor(r() * 3000));
  const now = () => new Date("2026-10-08T12:00:00");
  const when = () => ({ date: pick(dates) as string, time: pick(times) as string });

  /** the gate every screen has: core validate, then save */
  const commit = (recorder: PersonId, event: Event, label: string, gateErrors: readonly string[] = []) => {
    if (gateErrors.length > 0) return false;
    const seen = visible(recorder);
    const problems = process.env.SKIP_VALIDATE ? [] : validateEvent(event, catalog.value, seen);
    if (problems.length > 0) {
      rejected[problems[0]!.code] = (rejected[problems[0]!.code] ?? 0) + 1;
      log.push(`REJECT ${label} ${problems.map((p) => p.code).join(",")}`);
      return false;
    }
    docs.set(event.id, { event, participants: participantsOf(event, catalog.value, seen), deleted: false });
    accepted[label] = (accepted[label] ?? 0) + 1;
    log.push(`${label} ${event.id} ${JSON.stringify(event.effects[0])} @${event.date} ${event.time ?? ""}`);
    return true;
  };

  const mineWith = (recorder: PersonId, kind: string) =>
    visible(recorder).filter((e) => e.recordedBy === recorder && e.effects[0]?.kind === kind);

  const ops: ((recorder: PersonId) => void)[] = [
    // new expense
    (me) => {
      const ctx = { me, catalog: catalog.value, events: visible(me), now: now() };
      let form: RecordForm = defaultForm("expense", ctx);
      form = withPerson(form, pick([步, 寶]) as PersonId, catalog.value, ctx.events);
      const opts = accountOptions(catalog.value.accounts, "expense", form.person);
      form = { ...form, account: (r() < 0.2 ? "" : (pick(opts)?.id ?? "")) as AccountId | "" };
      form = withHelped(form, pick([步, 寶, "shared"]) as RecordForm["helped"], catalog.value);
      form = { ...form, jar: (pick(jarOptions(catalog.value, form.helped))?.id ?? DAILY_JAR), amount: amount(), ...(when() as { date: string; time: string }) };
      const ch = recordChanges(form, { id: `e${++nextId}` as EventId, me, now: ++clock, catalog: catalog.value, newTags: [] });
      commit(me, ch.events![0]!, "newExpense", checkRecordForm(form));
    },
    // new income
    (me) => {
      const ctx = { me, catalog: catalog.value, events: visible(me), now: now() };
      let form: RecordForm = defaultForm("income", ctx);
      form = withPerson(form, pick([步, 寶]) as PersonId, catalog.value, ctx.events);
      const opts = accountOptions(catalog.value.accounts, "income", form.person);
      form = { ...form, account: (r() < 0.2 ? "" : (pick(opts)?.id ?? "")) as AccountId | "", amount: amount(), ...(when() as { date: string; time: string }) };
      commit(me, buildIncome(form, { id: `e${++nextId}` as EventId, me, now: ++clock }), "newIncome", checkRecordForm(form));
    },
    // new transfer
    (me) => {
      const ctx = { me, catalog: catalog.value, events: visible(me), now: now() };
      let form = defaultTransfer(ctx);
      const a = catalog.value.accounts;
      form = withSource(form, (pick(sourceOptions(a))?.id ?? "") as AccountId | "", a);
      form = { ...form, to: (pick(targetOptions(a, form.from))?.id ?? "") as AccountId | "", amount: amount(), ...(when() as { date: string; time: string }) };
      if (form.from === "" || form.to === "") return;
      commit(me, buildTransfer(form, { id: `e${++nextId}` as EventId, me, now: ++clock }), "newTransfer", checkTransferForm(form));
    },
    // new reconcile (canReconcile = owners has me, not investment)
    (me) => {
      const a = pick(catalog.value.accounts.filter((x) => x.owners.includes(me) && x.kind !== "investment"));
      if (a === undefined) return;
      const form = { ...defaultReconcile(a.id, now()), actual: String(Math.floor(r() * 5000)), overpaid: a.kind === "credit-card" && r() < 0.1, ...(when() as { date: string; time: string }) };
      commit(me, buildReconciliation(form, a, { id: `e${++nextId}` as EventId, me, now: ++clock }), "newReconcile", checkReconcileForm(form, a));
    },
    // new refund (any visible expense)
    (me) => {
      const seen = visible(me);
      const target = pick(seen.flatMap((e) => { const t = refundTargetOf(e); return t === null ? [] : [t]; }));
      if (target === undefined) return;
      const left = refundable(target, seen);
      if (left <= 0) return;
      const form0 = defaultRefund(target, seen, now());
      const form = { ...form0, amount: String(1 + Math.floor(r() * (left + (r() < 0.05 ? 50 : 0)))), account: (r() < 0.3 ? (pick(refundAccountOptions(catalog.value.accounts, target.expense))?.id ?? form0.account) : form0.account) as AccountId | "", ...(r() < 0.5 ? (when() as { date: string; time: string }) : {}) };
      commit(me, buildRefund(form, target, { id: `e${++nextId}` as EventId, me, now: ++clock }), "newRefund", checkRefundForm(form, target, seen, { recordedAt: clock + 1 }));
    },
    // edit expense / income
    (me) => {
      const seen = visible(me);
      const e = pick(seen.filter((x) => x.recordedBy === me && (x.effects[0]?.kind === "expense" || x.effects[0]?.kind === "income")));
      if (e === undefined) return;
      const initial = formOf(e);
      if (initial === null) return;
      const locked = blockersOfDelete(e.id, seen).length > 0;
      let form: RecordForm = { ...initial, amount: r() < 0.5 ? amount() : initial.amount, ...(r() < 0.5 ? (when() as { date: string; time: string }) : {}) };
      if (!locked && r() < 0.4) form = withPerson(form, pick([步, 寶]) as PersonId, catalog.value, seen);
      if (r() < 0.5) form = { ...form, account: (r() < 0.2 ? "" : (pick(accountOptions(catalog.value.accounts, form.kind, form.person, form.account))?.id ?? form.account)) as AccountId | "" };
      if (form.kind === "expense") {
        if (!locked && r() < 0.4) form = withHelped(form, pick([步, 寶, "shared"]) as RecordForm["helped"], catalog.value);
        if (r() < 0.4) form = { ...form, jar: pick(jarOptions(catalog.value, form.helped, form.jar))?.id ?? form.jar };
      }
      const event = form.kind === "expense" ? buildExpense(form, { id: e.id, me, now: ++clock, existing: e }) : buildIncome(form, { id: e.id, me, now: ++clock, existing: e });
      commit(me, event, "editSpend", checkRecordForm(form));
    },
    // edit transfer
    (me) => {
      const seen = visible(me);
      const e = pick(mineWith(me, "transfer"));
      if (e === undefined) return;
      const initial = transferFormOf(e);
      if (initial === null) return;
      const a = catalog.value.accounts;
      let form = { ...initial, amount: r() < 0.5 ? amount() : initial.amount, ...(r() < 0.5 ? (when() as { date: string; time: string }) : {}) };
      if (r() < 0.4) {
        form = withSource(form, (pick(sourceOptions(a, form.from))?.id ?? form.from) as AccountId | "", a);
        if (form.to === "" || r() < 0.5) form = { ...form, to: (pick(targetOptions(a, form.from, form.to))?.id ?? "") as AccountId | "" };
      }
      if (form.from === "" || form.to === "") return;
      commit(me, buildTransfer(form, { id: e.id, me, now: ++clock, existing: e }), "editTransfer", checkTransferForm(form));
    },
    // edit reconcile
    (me) => {
      const e = pick(mineWith(me, "reconciliation"));
      if (e === undefined) return;
      const m = e.effects[0]!;
      const a = catalog.value.accounts.find((x) => m.kind === "reconciliation" && x.id === m.account)!;
      const initial = reconcileFormOf(e, a);
      if (initial === null) return;
      const form = { ...initial, actual: r() < 0.5 ? String(Math.floor(r() * 5000)) : initial.actual, ...(r() < 0.6 ? (when() as { date: string; time: string }) : {}) };
      commit(me, buildReconciliation(form, a, { id: e.id, me, now: ++clock, existing: e }), "editReconcile", checkReconcileForm(form, a));
    },
    // edit refund
    (me) => {
      const seen = visible(me);
      const e = pick(mineWith(me, "refund"));
      if (e === undefined) return;
      const m = e.effects[0]!;
      if (m.kind !== "refund") return;
      const target = refundTargetAt(seen, m.target);
      if (target === null) { note("refund-target-missing-in-edit", e.id); return; }
      const initial = refundFormOf(e, target);
      if (initial === null) return;
      const left = refundable(target, seen, e.id);
      const form = { ...initial, amount: r() < 0.5 ? String(1 + Math.floor(r() * Math.max(left, 1))) : initial.amount, account: (r() < 0.3 ? (pick(refundAccountOptions(catalog.value.accounts, target.expense, initial.account))?.id ?? initial.account) : initial.account) as AccountId | "", ...(r() < 0.5 ? (when() as { date: string; time: string }) : {}) };
      commit(me, buildRefund(form, target, { id: e.id, me, now: ++clock, existing: e }), "editRefund", checkRefundForm(form, target, seen, { recordedAt: e.recordedAt, self: e.id }));
    },
    // delete
    (me) => {
      const seen = visible(me);
      const e = pick(seen.filter((x) => x.recordedBy === me));
      if (e === undefined) return;
      if (blockersOfDelete(e.id, seen).length > 0) return;
      docs.get(e.id)!.deleted = true;
      log.push(`delete ${e.id}`);
    },
    // archive / unarchive
    (_me) => {
      const a = pick(catalog.value.accounts);
      if (a === undefined) return;
      catalog.value = {
        ...catalog.value,
        accounts: catalog.value.accounts.map((x) => {
          if (x.id !== a.id) return x;
          const { archived: _a, ...rest } = x;
          return x.archived ? rest : { ...rest, archived: true as const };
        }),
      };
      log.push(`archive ${a.id}`);
    },
  ];

  const weights = [8, 3, 4, 3, 5, 6, 2, 2, 3, 3, 1];
  const bag = weights.flatMap((w, i) => Array.from({ length: w }, () => i));

  for (let n = 0; n < opsCount; n++) {
    const who = r() < 0.75 ? 步 : 寶;
    ops[pick(bag) as number]!(who);
    check();
  }

  function check() {
    const cat = catalog.value;
    const all = allEvents();
    const god = openBook(cat, all);
    if (god.problems.length > 0) note("god-book-problem:" + god.problems[0]!.code, JSON.stringify(god.problems[0]));
    for (const person of [步, 寶]) {
      const seen = visible(person);
      const book = openBook(cat, seen);
      if (book.problems.length > 0) note(`viewer-book-problem:${book.problems[0]!.code}`, `${person} ${JSON.stringify(book.problems[0])}`);
      // viewer's own numbers must equal god's numbers (nothing hidden affects them; nothing they need is hidden)
      for (const measure of MEASURES) {
        const a = book.total({ measure, person });
        const b = god.total({ measure, person });
        if (a !== b) note(`viewer-vs-god:${measure}`, `${person} viewer=${a} god=${b}`);
      }
      for (const a of cat.accounts.filter((x) => x.owners.includes(person))) {
        const v = book.total({ measure: "balance", where: { account: a.id } });
        const g = god.total({ measure: "balance", where: { account: a.id } });
        if (v !== g) note("viewer-vs-god:account-balance", `${person} ${a.id} viewer=${v} god=${g}`);
      }
      // privacy: no visible event carries someone else's actual balance
      for (const e of seen) {
        for (const m of e.effects) {
          if (m.kind === "reconciliation") {
            const owners = cat.accounts.find((x) => x.id === m.account)?.owners ?? [];
            if (!owners.includes(person)) note("privacy:reconcile-visible-to-non-owner", `${person} sees ${e.id}`);
            if (owners.length > 1) note("privacy:reconcile-on-shared", e.id);
          }
        }
      }
      // flow must not throw
      flowDays(seen, cat, book, person);
      for (const a of cat.accounts.filter((x) => x.owners.includes(person))) flowDays(seen, cat, book, person, { account: a.id });
    }
    // transfers, reconciliations, refunds must not touch income; transfers & reconciliations not use/paid
    const noMoves = all.filter((e) => e.effects.every((m) => m.kind !== "transfer" && m.kind !== "reconciliation"));
    const noMovesBook = openBook(cat, noMoves);
    const noRefunds = all.filter((e) => e.effects.every((m) => m.kind !== "refund"));
    const noRefundsBook = openBook(cat, noRefunds);
    for (const person of [步, 寶]) {
      for (const measure of ["use", "paid", "income", "tab"] as const) {
        if (noMovesBook.total({ measure, person }) !== god.total({ measure, person })) note(`moves-change:${measure}`, person);
      }
      if (noRefundsBook.total({ measure: "income", person }) !== god.total({ measure: "income", person })) note("refund-changes-income", person);
    }
    // conservation: use across people == paid + what others' cards paid (no amortize here)
    const useAll = god.total({ measure: "use" });
    const paidAll = god.total({ measure: "paid" });
    const momLines = cat.accounts.filter((a) => a.paidByOthers).reduce((sum, a) => sum + god.lines({ measure: "balance", where: { account: a.id } }).filter((l) => l.cause === "spend" || l.cause === "refund").reduce((s, l) => s - l.amount, 0), 0);
    // refund to mom's card from a bank expense etc is separately reported below; only flag when all consistent
    const refundsConsistent = all.every((e) => e.effects.every((m) => {
      if (m.kind !== "refund") return true;
      const t = refundTargetAt(all, m.target);
      const into = m.account ?? t?.expense.account;
      const card = (id?: string) => cat.accounts.find((a) => a.id === id)?.paidByOthers === true;
      return card(into) === card(t?.expense.account);
    }));
    if (refundsConsistent && useAll !== paidAll + momLines) note("conservation:use!=paid+mom", `use=${useAll} paid=${paidAll} mom=${momLines}`);
    // refund invariants that validate enforces at save-time, re-checked against the CURRENT original
    for (const e of all) {
      for (const m of e.effects) {
        if (m.kind !== "refund") continue;
        const t = refundTargetAt(all, m.target);
        if (t === null) { note("refund:target-gone", e.id); continue; }
        const into = cat.accounts.find((a) => a.id === (m.account ?? t.expense.account));
        if (into !== undefined) {
          if (!into.owners.includes(t.expense.payer)) note("refund:account-not-payer", e.id);
          if (into.kind === "investment") note("refund:account-investment", e.id);
          if (into.paidByOthers === true && into.id !== t.expense.account) note("refund:into-other-mom-card-after-edit", `${e.id} into ${into.id}, original now on ${t.expense.account ?? "unknown"}`);
        }
        const doc = docs.get(e.id)!;
        const orig = docs.get(t.event.id)!;
        for (const p of orig.participants) if (!doc.participants.includes(p)) note("refund:participants-missing-original", `${e.id} lacks ${p}`);
        const total = refundsOf(all, t.ref).reduce((s, x) => s + x.amount, 0);
        if (total > t.item.amount) note("refund:over", e.id);
      }
    }
    // stored participants match what would be computed now
    for (const d of live()) {
      const fresh = participantsOf(d.event, cat, allEvents());
      if (JSON.stringify(fresh) !== JSON.stringify(d.participants)) note(`participants-stale:${d.event.effects[0]?.kind}`, `${d.event.id} stored=${d.participants} fresh=${fresh}`);
    }
  }
  return docs.size;
}

it("fuzz", () => {
  const findings = new Map<string, { count: number; sample: string }>();
  let total = 0;
  const seeds = Number(process.env.SEEDS ?? 150);
  const ops = Number(process.env.OPS ?? 120);
  for (let seed = 1; seed <= seeds; seed++) total += run(seed, ops, findings);
  console.log(`events written: ${total}; finding kinds: ${findings.size}`);
  console.log("accepted", JSON.stringify(accepted));
  console.log("rejected by core", JSON.stringify(rejected));
  for (const [k, v] of findings) console.log(`[${v.count}x] ${k}\n   ${v.sample}`);
  if (findings.size > 0) throw new Error(`fuzz 找到 ${findings.size} 種問題`);
});

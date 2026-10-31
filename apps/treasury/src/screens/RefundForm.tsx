import { refundsOf, type Event, type EventId } from "@baobu/core";
import { useState, type FormEvent } from "react";
import { KIND_LABEL } from "../accounts";
import { DeleteArea, ErrorList, RecordHead, WhenFields, storeEvent } from "../components/RecordParts";
import { dayLabel, money } from "../format";
import { buildRefund, checkRefundForm, defaultRefund, refundAccountOptions, refundTargetOf, refundable, type RefundForm as Form, type RefundTarget } from "../refund";
import { routeHash } from "../route";
import type { Screen } from "./Treasury";

/** 退款（新的）：從支出的詳情進來 */
export function RefundScreen({ id, screen }: { id: EventId; screen: Screen }) {
  const { events, back } = screen;
  const event = events.find((e) => e.id === id);
  const target = event === undefined ? null : refundTargetOf(event);
  const left = target === null ? 0 : refundable(target, events);
  if (target === null || left <= 0) {
    return (
      <>
        <button type="button" className="plain back" onClick={back}>
          ← 返回
        </button>
        <p>{target === null ? "這一則不能退款。" : "這筆已經全部退完了。"}</p>
      </>
    );
  }
  return <RefundForm screen={screen} target={target} initial={defaultRefund(target, events, new Date())} />;
}

export function RefundForm({ screen, target, initial, editing }: { screen: Screen; target: RefundTarget; initial: Form; editing?: EventId }) {
  const { me, catalog, events, back } = screen;
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<readonly string[]>([]);
  const [openedAt] = useState(() => Date.now());
  const existing = editing === undefined ? undefined : events.find((e) => e.id === editing);
  const left = refundable(target, events, editing);
  const accounts = refundAccountOptions(catalog.accounts, target.expense, form.account);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = checkRefundForm(form, target, events, { recordedAt: existing?.recordedAt ?? openedAt, ...(editing === undefined ? {} : { self: editing }) });
    setErrors(found);
    if (found.length > 0) return;
    const event = buildRefund(form, target, { id: crypto.randomUUID() as EventId, me, now: Date.now(), ...(existing === undefined ? {} : { existing }) });
    const problems = storeEvent(screen, event, editing === undefined ? "退好了" : "改好了");
    setErrors(problems);
    if (problems.length > 0) return;
    back();
  };

  return (
    <form onSubmit={submit} className="form record">
      <RecordHead title={editing === undefined ? "退款" : "改這筆退款"} editing={editing !== undefined} onBack={back} />

      <p className="refund-of">
        <a href={routeHash({ name: "edit", event: target.event.id })}>
          {target.title ?? "這筆支出"}（{dayLabel(target.event.date)}）
        </a>
        <span className="muted">
          原本 {money(target.item.amount)} 元，還可以退 {money(left)} 元
        </span>
      </p>

      <label>
        金額
        <input className="amount" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} inputMode="numeric" autoComplete="off" autoFocus={editing === undefined} />
      </label>

      <label>
        退回哪個帳戶
        <select value={form.account} onChange={(e) => setForm((f) => ({ ...f, account: e.target.value as Form["account"] }))}>
          {target.expense.account === undefined && <option value="">不知道（不動任何帳戶）</option>}
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}（{KIND_LABEL[a.kind]}）{a.archived ? "（封存了）" : ""}
            </option>
          ))}
        </select>
      </label>

      <WhenFields date={form.date} time={form.time} onChange={(change) => setForm((f) => ({ ...f, ...change }))} />

      <p className="muted hint">退款不算收入：沖回原本那一項，它的罐子、標籤也跟著變少。</p>

      <ErrorList errors={errors} />

      <button type="submit" className="primary save-bar">
        {editing === undefined ? "記下來" : "存"}
      </button>

      {editing !== undefined && <DeleteArea id={editing} what="這筆退款" screen={screen} onError={setErrors} />}
    </form>
  );
}

/** 支出詳情上的註記：已退多少、每一筆（點進去可以改、刪），與「退款」 */
export function RefundSection({ event, screen }: { event: Event; screen: Screen }) {
  const { events } = screen;
  const target = refundTargetOf(event);
  if (target === null) return null;
  const records = refundsOf(events, target.ref);
  const left = refundable(target, events);
  const total = target.item.amount - left;
  return (
    <section className="refund-section">
      {records.length > 0 && (
        <>
          <strong>已退 {money(total)} 元</strong>
          <ul>
            {records.map((r) => (
              <li key={r.event}>
                <a href={routeHash({ name: "edit", event: r.event })}>
                  {dayLabel(r.date)} {money(r.amount)} 元
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
      {left > 0 ? (
        <a className="button" href={routeHash({ name: "refund", event: event.id })}>
          退款
        </a>
      ) : (
        <span className="muted">全部退完了</span>
      )}
    </section>
  );
}

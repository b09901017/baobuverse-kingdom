import { blockersOfDelete, type Event, type EventId, type Tag, type TagId } from "@baobu/core";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import { KIND_LABEL, meFirst, wallOrder } from "../accounts";
import { Choice } from "../components/Choice";
import { DeleteArea, ErrorList, RecordHead, RecordTabs, WhenFields } from "../components/RecordParts";
import { KINGDOM_ID, db } from "../firebase";
import { dayLabel, money } from "../format";
import { problemTexts } from "../problems";
import { reconcileFormOf } from "../reconcile";
import {
  accountOptions,
  checkRecordForm,
  defaultForm,
  formOf,
  jarOptions,
  rankTags,
  recordChanges,
  tagFromName,
  visibleTags,
  withHelped,
  withKind,
  withPerson,
  type Helped,
  type RecordForm,
} from "../record";
import { refundFormOf, refundTargetAt } from "../refund";
import { save } from "../store";
import { defaultTransfer, transferFormOf, type TransferForm as TransferValues } from "../transfer";
import { ReconcileForm, canReconcile } from "./ReconcileForm";
import { RefundForm, RefundSection } from "./RefundForm";
import { TransferForm } from "./TransferForm";
import type { Screen } from "./Treasury";

/** 三個分頁共用的（切分頁時留著） */
type Carried = Pick<RecordForm, "amount" | "title" | "date" | "time">;
const carriedOf = ({ amount, title, date, time }: Carried): Carried => ({ amount, title, date, time });

/** 記一筆（新的）：支出、收入同一個表單，轉帳另一個。改一筆用 EditRecordScreen，表單是同一個 */
export function RecordScreen({ screen }: { screen: Screen }) {
  const { me, catalog, events } = screen;
  const [start, setStart] = useState<{ readonly transfer: boolean; readonly kind: RecordForm["kind"]; readonly carried?: Carried }>({ transfer: false, kind: "expense" });
  const ctx = { me, catalog, events, now: new Date() };
  if (start.transfer) {
    const initial: TransferValues = { ...defaultTransfer(ctx), ...start.carried };
    return (
      <TransferForm
        screen={screen}
        initial={initial}
        onTab={(tab, form) => tab !== "transfer" && setStart({ transfer: false, kind: tab, carried: carriedOf(form) })}
      />
    );
  }
  return (
    <Form
      key="new"
      screen={screen}
      initial={{ ...defaultForm(start.kind, ctx), ...start.carried }}
      onTransfer={(form) => setStart({ transfer: true, kind: form.kind, carried: carriedOf(form) })}
    />
  );
}

/** 改一筆：只有記的人能改；表單表達不了的（拆過品項的）先不打開，不要假裝改得了。每一種一筆打開自己的表單 */
export function EditRecordScreen({ id, screen }: { id: EventId; screen: Screen }) {
  const { me, catalog, events, back } = screen;
  const event = events.find((e) => e.id === id);
  const leave = (
    <button type="button" className="plain back" onClick={back}>
      ← 返回
    </button>
  );
  if (event === undefined) {
    return (
      <>
        {leave}
        <p>找不到這一筆（可能已經刪掉了）。</p>
      </>
    );
  }
  if (event.recordedBy !== me) {
    const who = catalog.people.find((p) => p.id === event.recordedBy)?.name ?? event.recordedBy;
    return (
      <>
        {leave}
        <p>這筆是{who}記的，只有記的人能改。</p>
        <RefundSection event={event} screen={screen} />
      </>
    );
  }
  const form = editorOf(event, screen);
  if (form === null) {
    return (
      <>
        {leave}
        <p>這一則現在的表單改不了。</p>
      </>
    );
  }
  return form;
}

/** 這一則打開哪個表單；打不開是 null */
function editorOf(event: Event, screen: Screen) {
  const { me, catalog, events } = screen;
  const id = event.id;
  const m = event.effects[0];
  switch (m?.kind) {
    case "transfer": {
      const initial = transferFormOf(event);
      return initial === null ? null : <TransferForm key={id} screen={screen} initial={initial} editing={id} />;
    }
    case "reconciliation": {
      const account = catalog.accounts.find((a) => a.id === m.account);
      const initial = account === undefined ? null : reconcileFormOf(event, account);
      return account === undefined || initial === null || !canReconcile(account, me) ? null : <ReconcileForm key={id} screen={screen} account={account} initial={initial} editing={id} />;
    }
    case "refund": {
      const target = refundTargetAt(events, m.target);
      const initial = refundFormOf(event, target);
      return target === null || initial === null ? null : <RefundForm key={id} screen={screen} target={target} initial={initial} editing={id} />;
    }
    default: {
      const initial = formOf(event);
      return initial === null ? null : <Form key={id} screen={screen} initial={initial} editing={id} />;
    }
  }
}

function Form({ screen, initial, editing, onTransfer }: { screen: Screen; initial: RecordForm; editing?: EventId; onTransfer?: (form: RecordForm) => void }) {
  const { me, catalog, events, prefs, back, notify, fail } = screen;
  const [form, setForm] = useState(initial);
  const [newTags, setNewTags] = useState<readonly Tag[]>([]);
  const [tagName, setTagName] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [errors, setErrors] = useState<readonly string[]>([]);

  const existing = editing === undefined ? undefined : events.find((e) => e.id === editing);
  const refunds = editing === undefined ? [] : blockersOfDelete(editing, events);
  const locked = refunds.length > 0;
  const now = () => new Date();

  const people = meFirst(catalog.people, me);
  const accounts = wallOrder(accountOptions(catalog.accounts, form.kind, form.person, form.account), prefs.accounts, events);
  const jars = jarOptions(catalog, form.helped, form.jar);
  const allTags = [...catalog.tags, ...newTags];
  const ranked = rankTags(allTags, events, prefs.tags, form.tags);

  const toggleTag = (id: TagId) =>
    setForm((f) => ({ ...f, tags: f.tags.includes(id) ? f.tags.filter((t) => t !== id) : [...f.tags, id] }));

  const addTag = () => {
    const result = tagFromName(tagName, allTags, crypto.randomUUID() as TagId);
    if (!result.ok) {
      setErrors([result.error]);
      return;
    }
    const { tag, isNew } = result.value;
    if (isNew) setNewTags((list) => [...list, tag]);
    setForm((f) => (f.tags.includes(tag.id) ? f : { ...f, tags: [...f.tags, tag.id] }));
    setTagName("");
    setErrors([]);
  };

  const enterAddsTag = (e: KeyboardEvent) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    addTag();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = checkRecordForm(form);
    setErrors(found);
    if (found.length > 0) return;
    const changes = recordChanges(form, {
      id: crypto.randomUUID() as EventId,
      me,
      now: Date.now(),
      catalog,
      newTags,
      ...(existing === undefined ? {} : { existing }),
    });
    const result = save(db, KINGDOM_ID, changes, { catalog, events });
    if (!result.ok) {
      setErrors(problemTexts(result.problems));
      return;
    }
    // 不等網路：離線時也馬上看到，恢復網路後才同步
    result.written.catch((err: Error) => fail(`這一筆沒有存到：${err.message}`));
    notify(editing === undefined ? "記好了" : "改好了");
    // 萬一沒有上一頁可回（直接開這個網址）：新的一筆留下空的表單，才不會同一筆存兩次
    if (editing === undefined) setForm(defaultForm(form.kind, { me, catalog, events, now: now() }));
    back();
  };

  return (
    <form onSubmit={submit} className="form record">
      <RecordHead title={editing === undefined ? "記一筆" : "改這一筆"} editing={editing !== undefined} onBack={back} />

      {editing === undefined && (
        <RecordTabs
          value={form.kind}
          onChange={(tab) => (tab === "transfer" ? onTransfer?.(form) : setForm((f) => withKind(f, tab, { me, catalog, events, now: now() })))}
        />
      )}

      {existing?.effects[0]?.kind === "expense" && <RefundSection event={existing} screen={screen} />}

      <label>
        金額
        <input
          className="amount"
          value={form.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          autoFocus={editing === undefined}
        />
      </label>

      <label>
        名稱（可以不填）
        <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} autoComplete="off" maxLength={200} />
      </label>

      <Choice
        label={form.kind === "expense" ? "誰出" : "誰收"}
        value={form.person}
        options={people.map((p) => ({ value: p.id, label: p.name }))}
        onChange={(person) => setForm((f) => withPerson(f, person, catalog, events))}
        disabled={locked}
      />

      <label>
        帳戶
        <select value={form.account} onChange={(e) => setForm((f) => ({ ...f, account: e.target.value as RecordForm["account"] }))}>
          <option value="">不知道</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}（{KIND_LABEL[a.kind]}）{a.archived ? "（封存了）" : ""}
            </option>
          ))}
        </select>
      </label>

      {form.kind === "expense" && (
        <>
          <Choice<Helped>
            label="幫誰"
            value={form.helped}
            options={[...people.map((p) => ({ value: p.id as Helped, label: p.name })), { value: "shared", label: "共" }]}
            onChange={(helped) => setForm((f) => withHelped(f, helped, catalog))}
            disabled={locked}
          />
          {locked && <p className="muted hint">這筆已經有退款，誰出、幫誰改不了（要改先刪退款）。</p>}
          <Choice
            label="罐子"
            value={form.jar}
            options={jars.map((j) => ({ value: j.id, label: j.archived ? `${j.name}（封存了）` : j.name }))}
            onChange={(jar) => setForm((f) => ({ ...f, jar }))}
          />
        </>
      )}

      <fieldset className="choice">
        <legend>標籤</legend>
        <div>
          {visibleTags(ranked, form.tags, expanded).map((tag) => (
            <button key={tag.id} type="button" className={form.tags.includes(tag.id) ? "chip on" : "chip"} aria-pressed={form.tags.includes(tag.id)} onClick={() => toggleTag(tag.id)}>
              {tag.name}
            </button>
          ))}
          <button type="button" className="chip quiet" aria-expanded={expanded} onClick={() => setExpanded((x) => !x)}>
            {expanded ? "收起來" : "更多"}
          </button>
        </div>
        {expanded && (
          <div className="add-tag">
            <input value={tagName} onChange={(e) => setTagName(e.target.value)} onKeyDown={enterAddsTag} placeholder="加新標籤" aria-label="新標籤的名字" autoComplete="off" maxLength={60} />
            <button type="button" onClick={addTag}>
              加
            </button>
          </div>
        )}
      </fieldset>

      <WhenFields date={form.date} time={form.time} onChange={(change) => setForm((f) => ({ ...f, ...change }))} />

      <ErrorList errors={errors} />

      <button type="submit" className="primary save-bar">
        {editing === undefined ? "記下來" : "存"}
      </button>

      {editing !== undefined &&
        (locked ? (
          <p className="muted hint">
            這筆有退款（{refunds.map((r) => `${dayLabel(r.date)} ${money(r.amount)} 元`).join("、")}），刪了退款會跟著失效。要刪這筆，先刪退款。
          </p>
        ) : (
          <DeleteArea id={editing} what="這筆" screen={screen} onError={setErrors} />
        ))}
    </form>
  );
}

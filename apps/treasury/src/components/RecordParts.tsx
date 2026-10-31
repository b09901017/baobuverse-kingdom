// 記一筆、轉帳、對帳、退款的表單共用的幾塊。

import type { EventId } from "@baobu/core";
import { useState } from "react";
import { KINGDOM_ID, db } from "../firebase";
import { problemTexts } from "../problems";
import { deleteEvent, save, type Changes } from "../store";
import type { Screen } from "../screens/Treasury";
import { Choice } from "./Choice";

export function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" className="plain back" onClick={onBack}>
      ← 返回
    </button>
  );
}

export function RecordHead({ title, editing, onBack }: { title: string; editing: boolean; onBack: () => void }) {
  return (
    <div className="record-head">
      <button type="button" className="plain back" onClick={onBack}>
        ← {editing ? "返回" : "取消"}
      </button>
      <h2>{title}</h2>
    </div>
  );
}

export type RecordTab = "expense" | "income" | "transfer";

/** 記一筆的分頁：改一筆時不出現（種類不能改） */
export function RecordTabs({ value, onChange }: { value: RecordTab; onChange: (tab: RecordTab) => void }) {
  return (
    <Choice<RecordTab>
      label="種類"
      value={value}
      options={[
        { value: "expense", label: "支出" },
        { value: "income", label: "收入" },
        { value: "transfer", label: "轉帳" },
      ]}
      onChange={onChange}
    />
  );
}

export function WhenFields({ date, time, onChange }: { date: string; time: string; onChange: (change: { date?: string; time?: string }) => void }) {
  return (
    <div className="when">
      <label>
        日期
        <input type="date" value={date} onChange={(e) => onChange({ date: e.target.value })} />
      </label>
      <label>
        時間
        <input type="time" value={time} onChange={(e) => onChange({ time: e.target.value })} />
      </label>
    </div>
  );
}

export function ErrorList({ errors }: { errors: readonly string[] }) {
  if (errors.length === 0) return null;
  return (
    <ul className="errors" role="alert">
      {errors.map((error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  );
}

/** 刪一則：先問一次；刪了只做標記。what 是問句裡怎麼叫它（這筆、這次對帳…） */
export function DeleteArea({ id, what, screen, onError }: { id: EventId; what: string; screen: Screen; onError: (errors: readonly string[]) => void }) {
  const { events, back, notify, fail } = screen;
  const [confirming, setConfirming] = useState(false);

  const remove = () => {
    const result = deleteEvent(db, KINGDOM_ID, id, events);
    if (!result.ok) {
      onError(problemTexts(result.problems));
      return;
    }
    result.written.catch((err: Error) => fail(`${what}沒有刪到：${err.message}`));
    notify("刪掉了");
    back();
  };

  if (!confirming) {
    return (
      <button type="button" className="quiet" onClick={() => setConfirming(true)}>
        刪掉{what}
      </button>
    );
  }
  return (
    <div className="confirm" role="alertdialog" aria-label={`確定要刪掉${what}嗎`}>
      <p>
        <strong>確定要刪掉{what}嗎？</strong>
      </p>
      <div className="confirm-actions">
        <button type="button" onClick={() => setConfirming(false)}>
          取消
        </button>
        <button type="button" className="danger" onClick={remove}>
          確定刪掉
        </button>
      </div>
    </div>
  );
}

/** 存一筆：core 擋下來就回傳白話，存得進去就不等網路（離線時也馬上看到，恢復網路後才同步） */
export function storeChanges(screen: Screen, changes: Changes, message: string): readonly string[] {
  const { catalog, events, notify, fail } = screen;
  const result = save(db, KINGDOM_ID, changes, { catalog, events });
  if (!result.ok) return problemTexts(result.problems);
  result.written.catch((err: Error) => fail(`沒有存到：${err.message}`));
  notify(message);
  return [];
}

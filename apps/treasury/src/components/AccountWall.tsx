import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Account, AccountId, AccountKind } from "@baobu/core";
import { KIND_LABEL, moved } from "../accounts";

/** 一張卡片上要顯示的字（算好的） */
export interface CardView {
  readonly account: Account;
  readonly balance: string;
  /** 共有帳戶：各自投入多少 */
  readonly shares: readonly string[];
  readonly note: string | undefined;
  /** 「N 天沒對帳」「還沒對帳」；沒什麼要說的是 null */
  readonly reconcile: string | null;
  readonly owners: string | undefined;
}

/** 卡片上的小圖：種類的第一個字，顏色在 index.css（--kind-*） */
const KIND_MARK: Readonly<Record<AccountKind, string>> = {
  cash: "現",
  "stored-value": "儲",
  bank: "銀",
  "credit-card": "信",
  investment: "投",
};

function Card({ view, onOpen }: { view: CardView; onOpen: (id: AccountId) => void }) {
  const { account, balance, shares, note, reconcile, owners } = view;
  return (
    <button type="button" className="card" onClick={() => onOpen(account.id)}>
      <span className="card-head">
        <span className={`mark kind-${account.kind}`} aria-hidden="true">
          {KIND_MARK[account.kind]}
        </span>
        <span className="card-name">{account.name}</span>
        <span className="muted card-kind">
          {KIND_LABEL[account.kind]}
          {owners && ` · ${owners}`}
        </span>
      </span>
      <span className="card-balance">{balance}</span>
      {shares.length > 0 && <span className="muted card-line">{shares.join("、")}</span>}
      {note && <span className="muted card-line">{note}</span>}
      {reconcile && <span className="card-stale">{reconcile}</span>}
    </button>
  );
}

function SortableCard({ view, onOpen }: { view: CardView; onOpen: (id: AccountId) => void }) {
  const { setNodeRef, listeners, transform, transition, isDragging } = useSortable({ id: view.account.id });
  return (
    <li
      ref={setNodeRef}
      className={isDragging ? "wall-slot dragging" : "wall-slot"}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...listeners}
    >
      <Card view={view} onOpen={onOpen} />
    </li>
  );
}

/**
 * 卡片牆。給了 order 和 onReorder 才能拖（封存的那一區不能）。
 * order 含封存的帳戶：封存的留在原本的位置，解封後回到那裡。
 * 手機長按才開始拖，沒按滿就滑動是捲頁面；電腦按住移動一點點才開始拖。所以點一下是打開，不會被當成拖曳。
 */
export function AccountWall({
  cards,
  order,
  onOpen,
  onReorder,
}: {
  cards: readonly CardView[];
  order?: readonly AccountId[];
  onOpen: (id: AccountId) => void;
  onReorder?: (order: readonly AccountId[]) => void;
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 8 } }),
  );

  if (order === undefined || onReorder === undefined) {
    return (
      <ul className="wall">
        {cards.map((view) => (
          <li key={view.account.id} className="wall-slot">
            <Card view={view} onOpen={onOpen} />
          </li>
        ))}
      </ul>
    );
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over === null || active.id === over.id) return;
    onReorder(moved(order, active.id as AccountId, over.id as AccountId));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={() => navigator.vibrate?.(15)} onDragEnd={onDragEnd}>
      <SortableContext items={cards.map((view) => view.account.id)} strategy={rectSortingStrategy}>
        <ul className="wall">
          {cards.map((view) => (
            <SortableCard key={view.account.id} view={view} onOpen={onOpen} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

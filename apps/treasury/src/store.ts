// 存讀 Firestore（docs/adr/0001「Firestore 上怎麼放」）。core 不知道 Firestore：轉換只在這一層。
// 每個函式都吃一個 Firestore，app 傳 firebase.ts 的 db，測試傳模擬器的。

import {
  participantsOf,
  validateEvent,
  type Account,
  type Catalog,
  type Event,
  type Jar,
  type Person,
  type PersonId,
  type Problem,
  type Tag,
} from "@baobu/core";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
  type Query,
} from "firebase/firestore";

/** 事件文件的形狀版本：Event 的形狀改了就加一 */
const EVENT_VERSION = 1;

const kingdomPath = (k: string) => `kingdoms/${k}`;

/** 事件文件：整則 Event，加上儲存這一層的四個欄位 */
export function toEventDoc(event: Event, catalog: Catalog, events: readonly Event[]): DocumentData {
  return {
    ...event,
    participants: participantsOf(event, catalog, events),
    updatedAt: serverTimestamp(),
    deleted: false,
    v: EVENT_VERSION,
  };
}

/** 讀回來的事件文件 → Event；刪除標記的、看不懂的版本回傳 null */
export function fromEventDoc(data: DocumentData): Event | null {
  const { participants: _participants, updatedAt: _updatedAt, deleted, v, ...event } = data;
  if (deleted === true || v !== EVENT_VERSION) return null;
  return event as Event;
}

/**
 * 這個登入帳號是哪個人；不是成員（或還沒建王國）就是 null。
 * 規則讓本人讀自己的成員文件（不存在也讀得到「不存在」），所以丟錯只會是網路：斷網又沒有快取時。
 */
export async function findMember(db: Firestore, k: string, uid: string): Promise<PersonId | null> {
  const snap = await getDoc(doc(db, kingdomPath(k), "members", uid));
  return snap.exists() ? (snap.get("person") as PersonId) : null;
}

/**
 * 建王國：王國還不存在時，第一個登入的人建王國、自己的成員文件和王國裡的人。
 * 王國已經在了，規則會拒絕（不是成員的人不能自己加進來）。
 */
export function foundKingdom(
  db: Firestore,
  k: string,
  uid: string,
  me: PersonId,
  people: readonly Person[],
): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(db, kingdomPath(k)), { founder: uid, createdAt: serverTimestamp() });
  batch.set(doc(db, kingdomPath(k), "members", uid), { person: me });
  for (const person of people) batch.set(doc(db, kingdomPath(k), "people", person.id), person);
  return batch.commit();
}

export interface Changes {
  readonly people?: readonly Person[];
  readonly accounts?: readonly Account[];
  readonly jars?: readonly Jar[];
  readonly tags?: readonly Tag[];
  readonly events?: readonly Event[];
}

export type SaveResult =
  | { readonly ok: false; readonly problems: readonly Problem[] }
  /** written：伺服器收到時才完成。斷網時會一直等，畫面不要等它（離線快取已經看得到） */
  | { readonly ok: true; readonly written: Promise<void> };

/**
 * 一次存好幾份文件（同一批，全部成功或全部失敗）。事件存之前用 core 檢查，
 * 檢查用的參考資料是現在的加上這一批的。
 */
export function save(
  db: Firestore,
  k: string,
  changes: Changes,
  current: { readonly catalog: Catalog; readonly events: readonly Event[] },
): SaveResult {
  const catalog = mergeCatalog(current.catalog, changes);
  const problems = (changes.events ?? []).flatMap((event) => validateEvent(event, catalog, current.events));
  if (problems.length > 0) return { ok: false, problems };

  const batch = writeBatch(db);
  const put = (name: string, items: readonly { readonly id: string }[] | undefined) => {
    for (const item of items ?? []) batch.set(doc(db, kingdomPath(k), name, item.id), item);
  };
  put("people", changes.people);
  put("accounts", changes.accounts);
  put("jars", changes.jars);
  put("tags", changes.tags);
  for (const event of changes.events ?? []) {
    batch.set(doc(db, kingdomPath(k), "events", event.id), toEventDoc(event, catalog, current.events));
  }
  return { ok: true, written: batch.commit() };
}

function mergeCatalog(catalog: Catalog, changes: Changes): Catalog {
  const merge = <T extends { readonly id: string }>(old: readonly T[], added: readonly T[] = []) => {
    const ids = new Set(added.map((item) => item.id));
    return [...old.filter((item) => !ids.has(item.id)), ...added];
  };
  return {
    people: merge(catalog.people, changes.people),
    accounts: merge(catalog.accounts, changes.accounts),
    jars: merge(catalog.jars, changes.jars),
    tags: merge(catalog.tags, changes.tags),
  };
}

/** 監聽參考資料：王國裡的人、罐子、標籤，和我是主人的帳戶 */
export function watchCatalog(
  db: Firestore,
  k: string,
  me: PersonId,
  onChange: (catalog: Catalog) => void,
  onError: (error: Error) => void,
): () => void {
  let catalog: Catalog = { people: [], accounts: [], jars: [], tags: [] };
  const loaded = new Set<keyof Catalog>();
  const listen = (key: keyof Catalog, ref: Query) =>
    onSnapshot(
      ref,
      (snap) => {
        catalog = { ...catalog, [key]: snap.docs.map((d) => d.data()) };
        loaded.add(key);
        if (loaded.size === 4) onChange(catalog);
      },
      onError,
    );
  const unsubscribes = [
    listen("people", collection(db, kingdomPath(k), "people")),
    listen("jars", collection(db, kingdomPath(k), "jars")),
    listen("tags", collection(db, kingdomPath(k), "tags")),
    // 規則只讓主人讀帳戶：查詢要帶 owners array-contains 我
    listen("accounts", query(collection(db, kingdomPath(k), "accounts"), where("owners", "array-contains", me))),
  ];
  return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
}

/**
 * 監聽我看得到的事件（參與者有我）。先用一般的監聽（ADR 0001「後果」：讀取量到額度一半前換成增量同步）。
 * fromCache：這一次的結果是不是只從本機快取來的（斷網時）。
 */
export function watchEvents(
  db: Firestore,
  k: string,
  me: PersonId,
  onChange: (events: readonly Event[], fromCache: boolean) => void,
  onError: (error: Error) => void,
): () => void {
  const mine = query(collection(db, kingdomPath(k), "events"), where("participants", "array-contains", me));
  return onSnapshot(
    mine,
    { includeMetadataChanges: true },
    (snap) => {
      const events = snap.docs.map((d) => fromEventDoc(d.data())).filter((e): e is Event => e !== null);
      onChange(events, snap.metadata.fromCache);
    },
    onError,
  );
}

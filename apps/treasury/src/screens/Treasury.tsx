import { openBook, type Book, type Catalog, type Event, type PersonId } from "@baobu/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "../auth";
import { KINGDOM_ID, db, useEmulators } from "../firebase";
import type { Presets } from "../presets";
import { parseRoute, routeHash, type Route } from "../route";
import { watchCatalog, watchEvents, watchPrefs, watchPresets, type Prefs } from "../store";
import { AccountScreen, NewAccountScreen } from "./AccountScreen";
import { AccountsScreen } from "./AccountsScreen";
import { FlowScreen } from "./FlowScreen";
import { ReconcileScreen } from "./ReconcileForm";
import { EditRecordScreen, RecordScreen } from "./RecordScreen";
import { RefundScreen } from "./RefundForm";
import { SettingsScreen } from "./SettingsScreen";

/** 登入之後每一頁都要的：資料（都是即時的）和在頁面之間移動 */
export interface Screen {
  readonly me: PersonId;
  readonly session: Session;
  readonly catalog: Catalog;
  readonly events: readonly Event[];
  readonly book: Book;
  readonly prefs: Prefs;
  /** 匯入過的預設資料；還沒匯入是 null */
  readonly presets: Presets | null;
  readonly go: (route: Route) => void;
  /** 回上一頁（表單存完、取消時） */
  readonly back: () => void;
  readonly notify: (message: string) => void;
  readonly fail: (message: string) => void;
}

const useRoute = () => {
  const [route, setRoute] = useState(() => parseRoute(location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
};

export function Treasury({ me, session, onError }: { me: PersonId; session: Session; onError: (message: string) => void }) {
  const [catalog, setCatalog] = useState<Catalog>();
  const [events, setEvents] = useState<readonly Event[]>();
  const [prefs, setPrefs] = useState<Prefs>();
  const [presets, setPresets] = useState<Presets | null>();
  const [offline, setOffline] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const route = useRoute();

  const fail = useCallback((e: Error) => onError(e.message), [onError]);
  useEffect(() => watchCatalog(db, KINGDOM_ID, setCatalog, fail), [fail]);
  useEffect(() => watchPrefs(db, KINGDOM_ID, me, setPrefs, fail), [me, fail]);
  useEffect(() => watchPresets(db, KINGDOM_ID, me, setPresets, fail), [me, fail]);
  useEffect(
    () =>
      watchEvents(
        db,
        KINGDOM_ID,
        me,
        (list, fromCache) => {
          setEvents(list);
          setOffline(fromCache);
        },
        fail,
      ),
    [me, fail],
  );
  useEffect(() => {
    if (notice === null) return;
    const timer = setTimeout(() => setNotice(null), 2_500);
    return () => clearTimeout(timer);
  }, [notice]);

  const book = useMemo(() => (catalog && events ? openBook(catalog, events) : undefined), [catalog, events]);
  if (!catalog || !events || !book || !prefs || presets === undefined) return <main className="center">載入中…</main>;

  const screen: Screen = {
    me,
    session,
    catalog,
    events,
    book,
    prefs,
    presets,
    go: (next) => {
      location.hash = routeHash(next);
    },
    back: () => history.back(),
    notify: setNotice,
    fail: onError,
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>國庫</h1>
        {useEmulators && <span className="muted">模擬器</span>}
      </header>
      {offline && <p className="banner">離線中：記的會先存在這台裝置，恢復網路後同步</p>}
      <main className="page">
        <Page route={route} screen={screen} />
      </main>
      {notice && (
        <p className="toast" role="status">
          {notice}
        </p>
      )}
      {route.name !== "record" && route.name !== "edit" && route.name !== "reconcile" && route.name !== "refund" && (
        <nav className="tabs" aria-label="分頁">
          <Tab label="帳戶" route={{ name: "accounts" }} current={route} />
          <Tab label="流水" route={{ name: "flow" }} current={route} />
          <a className="tab-record" href={routeHash({ name: "record" })}>
            記一筆
          </a>
          <Tab label="設定" route={{ name: "settings" }} current={route} />
        </nav>
      )}
    </div>
  );
}

function Page({ route, screen }: { route: Route; screen: Screen }) {
  switch (route.name) {
    case "accounts":
      return <AccountsScreen screen={screen} />;
    case "flow":
      return <FlowScreen account={route.account} screen={screen} />;
    case "settings":
      return <SettingsScreen screen={screen} />;
    case "record":
      return <RecordScreen screen={screen} />;
    case "edit":
      return <EditRecordScreen key={route.event} id={route.event} screen={screen} />;
    case "refund":
      return <RefundScreen key={route.event} id={route.event} screen={screen} />;
    case "reconcile":
      return <ReconcileScreen key={route.account} id={route.account} screen={screen} />;
    case "account":
      return <AccountScreen key={route.id} id={route.id} screen={screen} />;
    case "newAccount":
      return <NewAccountScreen owner={route.owner} screen={screen} />;
  }
}

function Tab({ label, route, current }: { label: string; route: Route; current: Route }) {
  const parent = current.name === "account" || current.name === "newAccount" ? "accounts" : current.name;
  return (
    <a className={route.name === parent ? "tab active" : "tab"} href={routeHash(route)} aria-current={route.name === parent ? "page" : undefined}>
      {label}
    </a>
  );
}

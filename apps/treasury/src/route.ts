// 畫面在哪一頁（放在網址的 # 後面）：手機的返回鍵、重新整理都對，也不會碰到 service worker 攔網址（lessons 第十一條）。

import type { AccountId, PersonId } from "@baobu/core";

export type Route =
  | { readonly name: "accounts" }
  | { readonly name: "flow"; readonly account?: AccountId }
  | { readonly name: "settings" }
  | { readonly name: "account"; readonly id: AccountId }
  | { readonly name: "newAccount"; readonly owner?: PersonId };

export function parseRoute(hash: string): Route {
  const [path = "", search = ""] = hash.replace(/^#\/?/, "").split("?");
  const params = new URLSearchParams(search);
  const [page, id] = path.split("/");
  switch (page) {
    case "flow": {
      const account = params.get("account");
      return account === null ? { name: "flow" } : { name: "flow", account: account as AccountId };
    }
    case "settings":
      return { name: "settings" };
    case "account": {
      if (id === undefined || id === "") return { name: "accounts" };
      if (id !== "new") return { name: "account", id: decodeURIComponent(id) as AccountId };
      const owner = params.get("owner");
      return owner === null ? { name: "newAccount" } : { name: "newAccount", owner: owner as PersonId };
    }
    default:
      return { name: "accounts" };
  }
}

export function routeHash(route: Route): string {
  switch (route.name) {
    case "accounts":
      return "#/";
    case "flow":
      return route.account === undefined ? "#/flow" : `#/flow?account=${encodeURIComponent(route.account)}`;
    case "settings":
      return "#/settings";
    case "account":
      return `#/account/${encodeURIComponent(route.id)}`;
    case "newAccount":
      return route.owner === undefined ? "#/account/new" : `#/account/new?owner=${encodeURIComponent(route.owner)}`;
  }
}

// 恆等式（04）：我付的 − 我用的 ＝ 往來帳因支出的變化 ＋ 寵對方 − 被寵（買東西的）＋ 待收的增加 − 寶媽卡幫出。
// 往來帳、待收、寶媽卡幫出都不含還款那幾行；被寵不含直接給錢；寶媽卡幫出 ＝ −（寶媽卡的餘額）。

import type { Book, Measure, PersonId, Where } from "./index";
import { 寶媽卡 } from "./test-kit";

export function 恆等式(book: Book, person: PersonId) {
  const total = (measure: Measure, where?: Where) => book.total(where === undefined ? { measure, person } : { measure, person, where });
  const 不含還款 = (measure: Measure, where: Where = {}) => total(measure, where) - total(measure, { ...where, cause: "repayment" });
  const 寶媽卡幫出 = -不含還款("balance", { account: 寶媽卡 });
  return {
    左邊: total("paid") - total("use"),
    右邊:
      不含還款("tab") +
      total("spoilGiven") -
      total("spoilReceived", { cause: "spend" }) +
      不含還款("receivable") -
      寶媽卡幫出,
  };
}

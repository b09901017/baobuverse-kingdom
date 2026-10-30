// 兩個 app 共用的規則。只放純 TypeScript：不 import Firebase、React，也不用瀏覽器的 API。
// 資料的形狀在 model.ts，數字怎麼算在 book.ts（docs/adr/0001）。

export const coreReady = true;

export type * from "./model";
export type {
  Book,
  Bucket,
  Cause,
  Debt,
  DebtChannel,
  DebtQuery,
  Dimension,
  Line,
  Measure,
  Query,
  Repay,
  Settled,
  Where,
} from "./book";
export type { Problem, ProblemCode } from "./validate";

export { openBook } from "./book";
export { participantsOf, validateEvent } from "./validate";
export { splitEvenly } from "./split";

import { coreReady } from "@baobu/core";

// 第一版畫面乾淨簡單；畫風之後整個換（plan.md「方向」）
export function App() {
  return (
    <main>
      <h1>國庫</h1>
      {!coreReady && <p>core 沒接好</p>}
    </main>
  );
}

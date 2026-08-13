# 環境筆記

Codebase 裡翻不到的隱性知識。改動環境時請一併更新這裡。

## Playwright：使用 pinned executablePath

**現象**：`chromium.launch()` 直接呼叫會失敗 —

```
browserType.launch: Executable doesn't exist at
/opt/pw-browsers/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell
```

**原因**：Claude Code 遠端容器預裝的 Chromium 是 build **1194**，但 `npm i playwright`
裝到的版本期待 build **1234**。容器設了 `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`，
所以 npm postinstall 不會補下載，兩邊就對不起來。**不要跑 `npx playwright install`** —
容器的磁碟配額是固定的，重抓瀏覽器很容易把它吃光。

**解法**：明確指定預裝的 binary。

```js
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
```

**⚠️ 這條路徑是脆的，兩種情況會壞掉：**

1. **升級 Playwright** — 期待的 build 號變了，但硬編碼的路徑還指向 1194。
2. **在本機跑** — `/opt/pw-browsers/` 是容器獨有的路徑，本機不存在。

**因此不要把這條路徑寫死在 committed 的程式碼裡。** 要走設定，例如：

```js
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;
// 容器內：export PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
// 本機：不設，讓 Playwright 用自己管理的瀏覽器
```

`undefined` 會讓 Playwright 回到預設查找行為，本機因此不受影響。

實際路徑用 `ls /opt/pw-browsers/` 確認，build 號會隨容器映像更新而變。

## Playwright MCP

已註冊在 user scope（`/root/.claude.json`）：

```
playwright: npx -y @playwright/mcp@latest — ✓ Connected
```

**MCP 工具只在 session 啟動時載入。** 剛註冊完的當下那個 session 看不到
`mcp__playwright__*`，要重開 session 才會出現。在那之前只能直接呼叫 Playwright 的 Node API。

## Skills

安裝在 `~/.claude/skills/`（user scope，**不在** git 裡）。清單、來源與稽核見
[`skill-audit.md`](./skill-audit.md)。

兩個安裝時做的修改，重裝時要記得重做：

- **`ui-ux-pro-max`** 原本是 plugin 形式，SKILL.md 裡有 11 處 `${CLAUDE_PLUGIN_ROOT}`。
  以一般 skill 安裝時這個變數是空的，已全部改寫成 `$HOME/.claude/skills/ui-ux-pro-max/`。
  用 `$HOME` 而非 `~` —— 因為路徑在指令裡被雙引號包住，`~` 在引號內不會展開。
- **`matt-code-review`** 原名 `code-review`，與內建的 `/code-review` 撞名。
  目錄名和 frontmatter 的 `name:` 都已改。

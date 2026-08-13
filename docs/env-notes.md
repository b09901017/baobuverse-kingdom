# 環境筆記

Codebase 裡翻不到的隱性知識。改動環境時請一併更新這裡。

---

## ⚠️ 所有 skill 必須 commit 進 repo 的 `.claude/skills/`

**雲端 session 不讀 `~/.claude/skills/`。** 裝到 home 目錄的 skill，換一個 session 就消失。

這是「不能搞錯的規定」，不是建議。官方文件的原文：

> Cowork sessions and cloud sessions, including routines, **don't read `~/.claude/skills/`** on your machine. ... Cloud sessions additionally load project skills committed to the cloned repository's `.claude/skills/`.

> If a skill exists only in `~/.claude/skills/`, Claude Code reports that the skill was **not found** when a routine invokes it, because each routine run starts as a fresh remote session.

雲端 session 跑在用完即回收的容器裡：repo 是啟動時重新 clone 的，容器閒置或結束後就被收回。
`~/.claude/` 底下的任何東西都不會留下。

**失敗模式長這樣**：今天把 skill 裝進 `~/.claude/skills/`，一切正常；明天回來開新 session，
`/grill-with-docs` 找不到，而且沒有任何錯誤訊息告訴你「東西被回收了」——
看起來就像 skill 從來沒裝過。

因此：

- 新增 skill → 一律放 `.claude/skills/<name>/SKILL.md`，並且 commit
- 不要用 `npx skills add` 之類會裝進 home 目錄的工具，除非之後手動搬進 repo
- MCP server 同理 → 用 repo 根目錄的 `.mcp.json`，不要用 `claude mcp add --scope user`

**同名時 personal 蓋過 project。** 你本機若也有 `~/.claude/skills/claude-md`，
在本機開 Claude Code 會用本機那份而非 repo 這份。排查「改了 repo 卻沒生效」時先查這個。

**Skill 有 live change detection**：改動 `.claude/skills/` 底下的檔案，當下 session 就會生效，
不用重開。但**新建**一個原本不存在的頂層 skills 目錄時要重開。MCP server 則一律需要重啟。

---

## Playwright：不要把瀏覽器路徑寫死

**現象**：`chromium.launch()` 直接呼叫會失敗 —

```
browserType.launch: Executable doesn't exist at
/opt/pw-browsers/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell
```

**原因**：雲端容器預裝的 Chromium 是 build **1194**，但 `npm i playwright` 裝到的版本期待
build **1234**。容器設了 `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`，npm postinstall 不會補下載，
兩邊就對不起來。**不要跑 `npx playwright install`** —— 容器磁碟配額固定，重抓瀏覽器容易吃光。

**解法**：明確指定預裝的 binary。

```js
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
});
```

`undefined` 會讓 Playwright 回到預設查找行為，所以本機不受影響。

**絕對不要把 `/opt/pw-browsers/...` 硬編碼進 committed 的程式碼**，兩種情況會壞：

1. **在本機跑** —— `/opt/pw-browsers/` 是容器獨有路徑，本機不存在。
2. **容器映像更新** —— build 號會變，寫死 1194 就失效。

需要在容器內解析時，用 glob 而非固定 build 號：

```bash
/opt/pw-browsers/chromium-*/chrome-linux/chrome
```

### Playwright MCP 的設定

註冊在 repo 根目錄的 `.mcp.json`（project scope，進 git）：

```json
{
  "mcpServers": {
    "playwright": {
      "command": "${CLAUDE_PROJECT_DIR:-.}/.claude/scripts/playwright-mcp.sh"
    }
  }
}
```

**為什麼要多包一層 shell script**：`.mcp.json` 是嚴格 JSON，**不支援註解**，而瀏覽器路徑逐機器不同。
把判斷放進 [`.claude/scripts/playwright-mcp.sh`](../.claude/scripts/playwright-mcp.sh)，
那裡可以寫註解，也可以做條件判斷。它的解析順序是：

1. `$PLAYWRIGHT_CHROMIUM_PATH` —— 顯式覆蓋，永遠優先
2. `/opt/pw-browsers/chromium-*/chrome-linux/chrome` —— 雲端容器，glob 不綁 build 號
3. 都沒有 → **不傳 `--executable-path`**，交給 Playwright 自己解析（本機情境）

關鍵在第 3 點：本機找不到容器路徑時它什麼都不傳，所以本機不會壞。

`${CLAUDE_PROJECT_DIR:-.}` 的 `:-.` 預設值不能省 —— 該變數是設在 MCP server 的環境裡，
不是 Claude Code 自己的環境，project-scoped 的 `.mcp.json` 引用它時必須給預設值。

**⚠️ 首次使用要手動核准**：project scope 的 MCP server 出於安全考量需要互動核准，
在 `claude mcp list` 會顯示 `⏸ Pending approval (run \`claude\` to approve)`。
而且**clone 下來的 repo 無法自我核准** —— 即使把 `enableAllProjectMcpServers` commit 進
`.claude/settings.json`，在未信任的目錄下也會被忽略。每個新的雲端 session 都要跑一次
`claude` 並接受 workspace trust 對話框。這是刻意的安全設計，不是 bug。

---

## Skills

安裝在 [`.claude/skills/`](../.claude/skills/)，**在 git 裡**。
清單、來源 SHA 與稽核結論見 [`skill-audit.md`](./skill-audit.md)。

兩處安裝時的修改，重裝或同步上游時要重做：

- **`ui-ux-pro-max`** 原本是 plugin 形式，SKILL.md 裡有 11 處 `${CLAUDE_PLUGIN_ROOT}`，
  以一般 skill 安裝時該變數為空。已全部改寫成
  `$(git rev-parse --show-toplevel)/.claude/skills/ui-ux-pro-max/`。
  用 `git rev-parse` 而非相對路徑，因為 agent 的工作目錄不固定；
  也不用 `~` —— 路徑在雙引號內 `~` 不展開。
  另外 `scripts/core.py:14` 以 `Path(__file__).parent.parent / "data"` 解析資料路徑，
  所以 `data/` 必須與 `scripts/` 同層，搬動時要保持這個結構。
- **`matt-code-review`** 原名 `code-review`，目錄名與 frontmatter 的 `name:` 都已改。
  避開與內建 `/code-review` 撞名 —— 文件明載 project 層的同名 skill 會**取代**內建版本，
  改名後兩者並存。

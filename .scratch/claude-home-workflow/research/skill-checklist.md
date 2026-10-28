# skill 與 CLAUDE.md 的檢查基準

> 「客廳」那一輪的 issue 02。給 03（kickoff、grill）、04（claude-md）、05（skill 重疊）逐條打勾用。
> **查證日期：2026-10-28**。官方文件會改，超過三個月再用之前重查一次出處。
>
> 標記：**〔官方〕** 有可點的官方出處；**〔判斷〕** 資深工程師的判斷，不是官方說法。
> 「怎麼查」那一欄是給打勾的人的具體動作。

## 讀過的來源

| 簡稱 | 來源 |
|---|---|
| CC-Skills | [Claude Code：Skills](https://code.claude.com/docs/en/skills) |
| BP | [Agent Skills：Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) |
| CC-Memory | [Claude Code：How Claude remembers your project（CLAUDE.md）](https://code.claude.com/docs/en/memory) |
| CC-Features | [Claude Code：Extend Claude Code（CLAUDE.md／rules／skill／hook／plugin 怎麼選）](https://code.claude.com/docs/en/features-overview) |
| CC-Settings | [Claude Code：Settings files and precedence](https://code.claude.com/docs/en/settings) |
| CC-Hooks | [Claude Code：Automate actions with hooks](https://code.claude.com/docs/en/hooks-guide) |
| CC-Plugins | [Claude Code：Plugins overview](https://code.claude.com/docs/en/plugins) |
| CC-Commands | [Claude Code：Commands](https://code.claude.com/docs/en/commands) |
| Eval | [agentskills.io：Evaluating skill output quality](https://agentskills.io/skill-creation/evaluating-skills)（CC-Skills 指過去的評估格式） |
| Prompting | [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) |
| skill-creator | 官方 `skill-creator` skill（2026-10-28 用 Skill 工具載入的版本） |
| WFA | repo 的 [`writing-for-agents`](../../../.claude/skills/writing-for-agents/SKILL.md)＋[`SKILL-MECHANICS.md`](../../../.claude/skills/writing-for-agents/SKILL-MECHANICS.md)（Matt） |
| CMD | repo 的 [`claude-md`](../../../.claude/skills/claude-md/SKILL.md) |
| Matt | repo 的 `grill-with-docs`、`to-spec`、`to-tickets`、`implement`、`handoff`、`wayfinder` |

---

## 一、skill 的檢查清單

### A. frontmatter 與名字

| # | 檢查 | 標記與出處 | 怎麼查 |
|---|---|---|---|
| A1 | `---` 是檔案第一行；YAML 解析得了（解析失敗時 skill 照樣載入但**所有欄位都是空的**，description 失效，`/名字` 還能叫） | 〔官方〕CC-Skills「Frontmatter」、「Skill not triggering」 | `claude plugin validate .claude/skills`（v2.1.233 起） |
| A2 | `name` 只用小寫英數與 `-`，≤64 字；目錄名與 `name` 一致 | 〔官方〕BP「Skill structure」；CC-Skills（`name` 預設取目錄名） | 看 frontmatter |
| A3 | 名字不要用 `synced`、`anthropic-skills` | 〔官方〕CC-Skills「Characters a skill name can't hold」 | — |
| A4 | 名字裡不要有 `claude`、`anthropic`：**Claude Code 不擋**，但 API／claude.ai 上傳會擋（BP 列為保留字） | 〔官方〕BP「Skill structure」；CC-Skills 只保留 A3 那兩個 | 只在 skill 可能上傳到 claude.ai 時才算問題（見第三節衝突 6） |
| A5 | 同名時 enterprise > personal > project；plugin 的 skill 有命名空間（`plugin:skill`）不會撞 | 〔官方〕CC-Skills「Locations and precedence」；CC-Features「Understand how features layer」 | 本機 `~/.claude/skills/` 有同名的話，repo 那份不會生效 |
| A6 | 不要跟內建指令撞名（project 的同名 skill 會取代內建的） | 〔官方〕CC-Skills（skill 與 `.claude/commands/` 同名時 skill 贏）；這個 repo 的前例：`code-review` 改名 `matt-code-review`（`docs/env-notes.md`） | 對 CC-Commands 的清單 |

### B. description（觸發）

| # | 檢查 | 標記與出處 | 怎麼查 |
|---|---|---|---|
| B1 | 同時寫「做什麼」與「什麼時候用」 | 〔官方〕BP「Writing effective descriptions」；CC-Skills 欄位表 | 讀一遍 |
| B2 | **最關鍵的用途放最前面**：description＋`when_to_use` 合計在清單裡超過 1,536 字會被截掉；skill 很多時，用得少的 skill 的 description 會先被整段拿掉 | 〔官方〕CC-Skills「Skill descriptions are cut short」 | 數字數；`/doctor`、`/skill-doctor` 看清單成本 |
| B3 | 長度上限：Claude Code 合計 1,536 字；API／claude.ai 的 `description` 上限 1,024 字、不能有 XML 標籤 | 〔官方〕CC-Skills；BP「Skill structure」 | 取嚴的：≤1,024 |
| B4 | 第三人稱描述（「處理 Excel 檔並產生報表」），不寫「我可以幫你」「你可以用它」 | 〔官方〕BP「Writing effective descriptions」 | 中文：寫成「做什麼。使用者說…時使用」，不寫「我／你」 |
| B5 | 寫使用者**真的會講的字**當觸發；具體、含關鍵詞，不要「幫忙處理文件」這種 | 〔官方〕BP；CC-Skills「Skill not triggering」第 1 點 | 拿第 G 節的觸發測試驗 |
| B6 | 一個分支一個觸發詞；同義詞換句話說的是同一個分支，收成一個 | 〔判斷〕WFA「Context pointers」（Matt 的寫法，非官方） | 數觸發詞，同義的合併 |
| B7 | 觸發太常 → description 寫窄、或改 `disable-model-invocation: true`；觸發太少 → 補使用者會講的字 | 〔官方〕CC-Skills「Skill triggers too often／not triggering」 | — |
| B8 | 語氣：說清楚何時用即可，不要 `CRITICAL: You MUST` 那種大寫強調 —— 新模型對系統提示更敏感，強烈語氣會造成**過度觸發** | 〔官方〕Prompting（「soften any aggressive language」、「Remove over-prompting」）；與 skill-creator 的「寫得 pushy 一點」衝突，見第三節衝突 1 | 有沒有「一定要」「就算…也一樣」「MUST」這類字，有的話用觸發測試確認沒有過度觸發 |
| B9 | 每一支 skill 的 description 都每回合佔 context；描述模糊或互相重疊會讓 Claude 載錯或漏載 | 〔官方〕CC-Features「How Claude chooses skills」、「Context cost by feature」 | 05 用：兩支 description 有同樣觸發詞就是重疊 |

### C. 誰能叫：`disable-model-invocation`／`user-invocable`

| # | 檢查 | 標記與出處 | 怎麼查 |
|---|---|---|---|
| C1 | **有副作用或要自己掌握時機**的流程（部署、commit、送訊息）設 `disable-model-invocation: true`；設了之後 description 不進 context，零成本 | 〔官方〕CC-Skills「Control who invokes a skill」；CC-Features「Context cost by feature」 | — |
| C2 | 設了 `disable-model-invocation` 的 skill，description 變成**給人看的一行摘要**，觸發詞可以拿掉 | 〔判斷〕WFA `SKILL-MECHANICS.md`「Invocation」（官方只說 description 不進 context） | Matt 的 skill 都這樣寫：`grill-with-docs`、`implement`、`handoff` 都只有一句 |
| C3 | 只有「AI 自己要想到用」或「別的 skill 要叫它」時才讓模型能叫；只會被人手動叫的，關掉模型呼叫 | 〔判斷〕WFA `SKILL-MECHANICS.md` | — |
| C4 | 純背景知識、不是一個動作的 → `user-invocable: false` | 〔官方〕CC-Skills「Control who invokes a skill」 | — |
| C5 | 被關掉模型呼叫的 skill，**別的 skill 也叫不到它**；兩支這種 skill 共用的參考要放在 skill 系統外的普通檔案 | 〔判斷〕WFA `SKILL-MECHANICS.md` | 05 用：kickoff 若改成手動叫，它引用的東西要能被找到 |
| C6 | 別人寫的 skill 不改檔也能調：settings 的 `skillOverrides`（`on`／`name-only`／`user-invocable-only`／`off`；plugin 的 skill 不吃這個） | 〔官方〕CC-Skills「Override skill visibility from settings」 | 05 的建議可以用這個，不用刪 skill |

### D. 正文長度、結構、漸進揭露

| # | 檢查 | 標記與出處 | 怎麼查 |
|---|---|---|---|
| D1 | `SKILL.md` 正文 **< 500 行**；接近就拆到別的檔 | 〔官方〕CC-Skills；BP「Progressive disclosure patterns」、「Token budgets」 | `wc -l`（現況見第四節） |
| D2 | 參考檔**從 SKILL.md 直接連過去，只一層**；檔中再連檔，Claude 可能只 `head` 一部分 | 〔官方〕BP「Avoid deeply nested references」 | 看連結圖 |
| D3 | 超過 100 行的參考檔開頭放目錄 | 〔官方〕BP「Structure longer reference files with a table of contents」（skill-creator 說 300 行，取嚴的） | — |
| D4 | 連結處寫清楚**什麼情況才讀它**（「做表單才讀 FORMS.md」） | 〔官方〕BP Pattern 1、3；skill-creator「Reference files clearly … with guidance on when to read them」 | — |
| D5 | 每一個分支都要的放正文；只有部分分支要的推到參考檔 | 〔判斷〕WFA「Information hierarchy」 | — |
| D6 | **最重要的指示放最上面**：被 compaction 之後只會再附上每支 skill 的前 5,000 token（全部 skill 合計 25,000） | 〔官方〕CC-Skills「Skill content lifecycle」、「Claude stops following a skill」 | 開頭幾段是不是最不能漏的那幾條 |
| D7 | skill 只在叫的那一刻載入、之後不重讀 → 要整個任務都適用的，寫成**常駐的規則**（「每改一次就跑測試」），不是一次性的步驟（「跑測試」） | 〔官方〕CC-Skills「Skill content lifecycle」、「Claude stops following a skill」 | — |
| D8 | 一定要每次都成立的規則（不能違反）→ **hook**，可以寫在 skill 的 `hooks` frontmatter；文字只是請求 | 〔官方〕CC-Skills「Claude stops following a skill」；CC-Features「Put guardrails in hooks」；CC-Hooks | 找「絕對」「不能」「一律」的句子，問「沒做到會怎樣」 |
| D9 | 複雜流程給步驟與可以複製打勾的清單；品質要緊的地方放「驗證 → 修 → 再驗證」迴圈 | 〔官方〕BP「Workflows and feedback loops」 | — |
| D10 | 每一步有**看得出做完沒的完成條件** | 〔判斷〕WFA「Steps and completion criteria」 | 每一步問「怎麼知道做完了」 |
| D11 | 自由度配合風險：容易出錯、要一致的給精確指令或腳本；有很多做法的給方向 | 〔官方〕BP「Set appropriate degrees of freedom」 | — |

### E. 寫什麼、不寫什麼

| # | 檢查 | 標記與出處 | 怎麼查 |
|---|---|---|---|
| E1 | 只寫 Claude 不知道的；每段問「這段值得它的 token 嗎」 | 〔官方〕BP「Concise is key」 | 逐段刪刪看，行為會不會變 |
| E2 | 模型本來就會做的（no-op）整句刪 | 〔判斷〕WFA「Pruning」 | — |
| E3 | 環境查得到的（`package.json`、設定檔、目錄）不抄，抄了會過期；只寫查不到的慣例、理由、坑 | 〔判斷〕WFA「Pruning」；同方向的官方說法在 CC-Memory「My CLAUDE.md is too large」 | — |
| E4 | 同一件事只寫一個地方；skill 與 CLAUDE.md 不重寫對方的規定 | 〔判斷〕WFA「Pruning」（single source of truth）；〔官方〕CC-Memory「Consistency」（兩條互相矛盾時 Claude 可能隨便挑一條） | grep 同一條規則出現幾處 |
| E5 | 不放會過時的資訊（「某月以前用舊 API」）；舊做法放「old patterns」摺起來 | 〔官方〕BP「Avoid time-sensitive information」 | 找日期與「目前」「現在」 |
| E6 | 用詞前後一致，一個概念一個詞 | 〔官方〕BP「Use consistent terminology」 | — |
| E7 | **說明為什麼**，少用全大寫的 ALWAYS／NEVER；理由讓模型判斷邊界情況 | 〔官方〕Prompting（給指示的背景與動機）；skill-creator「Explain the why」；Eval「Explain the why」 | — |
| E8 | 正向寫要的行為；禁止句只留給寫不成正向的硬護欄，而且配一句正向的 | 〔判斷〕WFA「Leading words」的 Negation 一段 | 數「不要」開頭的句子 |
| E9 | 給一個預設做法＋一個例外出口，不要列一串選項 | 〔官方〕BP「Avoid offering too many options」 | — |
| E10 | 範例具體不抽象；輸出格式要嚴格時給模板 | 〔官方〕BP「Template pattern」、「Examples pattern」 | — |
| E11 | 路徑一律 `/`；腳本用 `${CLAUDE_SKILL_DIR}` 找自己的檔 | 〔官方〕BP「Avoid Windows-style paths」；CC-Skills 範例 | 這個專案在 Windows 上寫，特別注意 |
| E12 | MCP 工具寫全名（`伺服器:工具`） | 〔官方〕BP「MCP tool references」 | — |
| E13 | 公開 repo：不帶真名、帳號、email、金鑰 | 〔判斷〕這個 repo 的規矩（`CLAUDE.md`、HANDOFF） | 推之前 grep |

### F. 腳本（有附腳本的 skill 才看）

| # | 檢查 | 標記與出處 |
|---|---|---|
| F1 | 腳本自己處理錯誤，不丟給 Claude 猜 | 〔官方〕BP「Solve, don't defer」 |
| F2 | 常數寫理由，沒有魔術數字 | 〔官方〕BP「Solve, don't defer」 |
| F3 | 寫清楚是「執行它」還是「讀它當參考」 | 〔官方〕BP「Provide utility scripts」 |
| F4 | 需要的套件寫在 SKILL.md，不假設已安裝 | 〔官方〕BP「Avoid assuming tools are installed」 |
| F5 | 批次或破壞性的操作：先產生計畫檔 → 驗證 → 才執行 | 〔官方〕BP「Create verifiable intermediate outputs」 |
| F6 | 每次測試都各自寫了類似的輔助腳本 → 收進 `scripts/` | 〔官方〕skill-creator「Look for repeated work」；Eval「Bundle repeated work」 |

### G. 評估

| # | 檢查 | 標記與出處 | 怎麼做 |
|---|---|---|---|
| G1 | **先有評估再寫長文件**：先讓 Claude 不帶 skill 做幾個真實任務，記下失敗的地方，再寫剛好夠的指示 | 〔官方〕BP「Build evaluations first」 | — |
| G2 | 至少三個情境；先 2～3 個，看過第一輪結果再加 | 〔官方〕BP 清單「At least three evaluations」；Eval「Start with 2-3 test cases」 | — |
| G3 | 每個情境跑兩次：**有 skill vs 沒有 skill**（改既有 skill 時是 vs 舊版快照） | 〔官方〕Eval「Running evals」；skill-creator Step 1 | 改 kickoff／claude-md 時，舊版就是現在 repo 那一份 |
| G4 | 斷言（assertion）看過第一輪輸出才寫；要客觀可驗；主觀的（文風）交給人看 | 〔官方〕Eval「Writing assertions」；skill-creator Step 2 | — |
| G5 | 兩邊都永遠過的斷言拿掉（不分辨），兩邊都永遠不過的檢查是不是斷言壞了 | 〔官方〕Eval「Analyzing patterns」 | — |
| G6 | 觸發測試：寫 8～10 條該觸發、8～10 條**差一點但不該觸發**的真實語句，量命中率 | 〔官方〕skill-creator「Description Optimization」；CC-Skills（`claude plugin eval` 的 `tool_used: Skill` grader 只給 plugin 的 skill） | 太簡單的單步請求本來就不會觸發 skill，不要拿來當測試 |
| G7 | 用 Claude A 改、Claude B（全新的、只載 skill）試，觀察 B 怎麼讀檔、漏了什麼 | 〔官方〕BP「Develop Skills iteratively with Claude」 | 這個環境：一個 subagent 當 B |
| G8 | 用打算用的每一個模型試（Haiku／Sonnet／Opus） | 〔官方〕BP「Test with all models you plan to use」 | 見第三節衝突 7 |
| G9 | 用量：記 token 與時間，跟沒 skill 比（貴三倍換 2% 不值） | 〔官方〕Eval「Capturing timing data」、「Aggregating results」 | — |
| G10 | 改完看實際用量與花費：`/skill-doctor`、`/doctor`、`/context` | 〔官方〕CC-Skills、CC-Commands | — |
| G11 | 指示檔整體健檢：`/doctor prompt-audit [路徑]`（找寫給舊模型的指示、指到不存在的檔、互相矛盾） | 〔官方〕CC-Memory「Audit your instruction files」；CC-Commands | 03、04 改完各跑一次 |

### H. 放哪裡、怎麼分發

| # | 檢查 | 標記與出處 |
|---|---|---|
| H1 | 要在雲端 session 用的 skill，**commit 進 repo 的 `.claude/skills/`** —— 雲端 session 不讀 `~/.claude/skills/`，也不載入本機設定裡的 plugin | 〔官方〕CC-Plugins「Understand install scopes」（cloud session 不載本機 plugin）；`docs/env-notes.md` 引的官方原文 |
| H2 | 跨很多 repo 共用一套 skill／hook → 官方的包裝方式是 **plugin**（`--plugin-dir` 不用 marketplace 也能載） | 〔官方〕CC-Features「Build your setup over time」（第二個 repo 要同一套 → plugin）；CC-Plugins |
| H3 | 改 skill 當下就生效；新開一個頂層 skills 目錄要 `/reload-skills` | 〔官方〕CC-Skills「Live change detection」；CC-Commands |

---

## 二、CLAUDE.md 的檢查清單

| # | 檢查 | 標記與出處 | 怎麼查 |
|---|---|---|---|
| M1 | **每一份 < 200 行**；超過會多吃 context、**降低遵守度**，啟動時會警告 | 〔官方〕CC-Memory「Write effective instructions」、「My CLAUDE.md is too large」；CC-Features | `wc -l` |
| M2 | 該放的：**每個 session 都要的**事實 —— build 指令、慣例、版面、「一律做 X」「絕不做 X」 | 〔官方〕CC-Memory「When to add to CLAUDE.md」；CC-Features「CLAUDE.md vs Skill」 | — |
| M3 | 什麼時候加一條：Claude **第二次**犯同一個錯、code review 抓到它該知道的、你在對話裡打了上次打過的同一句糾正 | 〔官方〕CC-Memory「When to add to CLAUDE.md」；CC-Features「Build your setup over time」 | 新增的那條有沒有「第二次」的證據 |
| M4 | 不該放的 → 搬走：**多步驟流程** → skill；**只跟一部分程式有關** → `.claude/rules/`（`paths:` 限定）或子目錄的 CLAUDE.md；**偶爾才用的參考** → skill | 〔官方〕CC-Memory「When to add」、「Organize rules with .claude/rules/」；CC-Features「CLAUDE.md vs Rules vs Skills」 | 每一條問「大部分任務都用得到嗎」 |
| M5 | 能從 code 推出來的（目錄結構、相依清單、架構總覽）刪；留坑、理由、跟工具預設不同的慣例 | 〔官方〕CC-Memory「My CLAUDE.md is too large」（`/doctor` 的修剪標準） | `/doctor` |
| M6 | 寫成**可驗證**的具體句子（「改完跑 `npm test`」不是「記得測試」） | 〔官方〕CC-Memory「Write effective instructions」 | — |
| M7 | 用標題與條列分組，不要大段文字 | 〔官方〕CC-Memory「Structure」 | — |
| M8 | 沒有互相矛盾的兩條（含子目錄 CLAUDE.md、rules、使用者層級）；矛盾時 Claude 可能隨便挑一條 | 〔官方〕CC-Memory「Consistency」 | `/doctor prompt-audit` |
| M9 | 一定要成立的 → **hook**；CLAUDE.md 是 context，不是強制設定 | 〔官方〕CC-Memory 開頭、「Claude isn't following my CLAUDE.md」；CC-Features「Put guardrails in hooks」 | 找「絕對」「一律」 |
| M10 | `@import` 只是整理，**不省 context**（被 import 的一起載入）；最多遞迴 4 層 | 〔官方〕CC-Memory「Import additional files」、「Size」 | — |
| M11 | 子目錄的 CLAUDE.md 與有 `paths:` 的 rule **按需載入**；超過單檔上限（200K context 時 40,000 字）只會讀到開頭 | 〔官方〕CC-Memory「How CLAUDE.md files load」、「Claude ignores the end of my subdirectory CLAUDE.md」 | `wc -m` |
| M12 | 個人、不進 git 的 → `CLAUDE.local.md`（gitignore）或 `~/.claude/CLAUDE.md`、`~/.claude/rules/`（所有專案） | 〔官方〕CC-Memory 位置表、「User-level rules」 | — |
| M13 | 給人看的維護註記用 `<!-- -->`，注入前會被拿掉，不花 token | 〔官方〕CC-Memory「How CLAUDE.md files load」 | — |
| M14 | 專案根目錄的 CLAUDE.md 撐得過 `/compact`（會重讀）；只在對話裡講過的指示不會 | 〔官方〕CC-Memory「Instructions seem lost after /compact」 | 一再要重講的那句 → 寫進去 |
| M15 | 有 `AGENTS.md`：有 CLAUDE.md 時預設**只讀 CLAUDE.md**；要兩個都用就在 CLAUDE.md 寫 `@AGENTS.md` | 〔官方〕CC-Memory「AGENTS.md」 | — |
| M16 | commit／PR 規則寫在 CLAUDE.md 時，會跟內建的打架 → `includeGitInstructions`、`attribution` 設定 | 〔官方〕CC-Memory「Claude isn't following my CLAUDE.md」 | 這個專案的 CLAUDE.md 目前沒有 commit 規則 |
| M17 | 新增與修剪**成對**：加一條就找一條刪 —— 只加不減的規則檔會一路長大 | 〔判斷〕CMD「維護」模式；上一個專案的 CLAUDE.md 就是只加不減長到一百多 KB（細節在私人 repo 的盤點） | 看 git log 這個檔的增刪 |
| M18 | 規則要寫成會改變行為的；理由**會改變行為時**才寫 | 〔判斷〕CMD「撰寫規範」；與 E7 的關係見第三節衝突 2 | — |

---

## 三、官方與 `writing-for-agents`／`claude-md`／`skill-creator` 意見不一致的地方

| # | 衝突 | 一邊 | 另一邊 | 以哪個為準 |
|---|---|---|---|---|
| 1 | **description 要多強勢** | skill-creator：Claude 傾向「少觸發」，description 寫得 pushy 一點（「就算使用者沒明講也要用」）；`kickoff`、`claude-md` 的 description 就是這樣寫（「一定要使用這個 skill —— 就算…也一樣」） | Prompting：新模型對系統提示更敏感，原本為了防少觸發寫的強烈語氣會造成**過度觸發**，要放軟 | **以實測為準，起點放軟**。寫清楚觸發情境（skill-creator 的實質要求），拿掉「一定要」「MUST」那種強調（Prompting）；用 G6 的觸發測試量，少觸發才加強。理由：skill-creator 自己的 Description Optimization 就是量出來調的 |
| 2 | **要不要寫理由** | CMD：「不解釋原因，除非原因會改變行為」 | skill-creator、Eval、Prompting：說明為什麼，比硬性規則有效 | **不衝突，是兩種文件**：CLAUDE.md 每次都載入，理由省著寫（CMD 的例外條款就是官方的意思）；skill 只在叫的時候載入，理由多寫。04 改 CMD 時把「除非原因會改變行為」寫得更明確 |
| 3 | **CMD「Anthropic 刪掉了超過 80% 的規則」** | CMD「開始前：確認模型世代」 | 官方文件裡**查不到這個數字**（2026-10-28 查 Prompting、CC-Memory、CC-Settings；CC-Settings 還說系統提示不公開） | **刪掉這個數字**，改指 Prompting 的「Migration considerations」與 `/doctor prompt-audit`（它會找「寫給舊模型的指示」） |
| 4 | **CMD 的去處表少了 `.claude/rules/`** | CMD：只跟一個資料夾有關 → 子目錄 CLAUDE.md | CC-Memory、CC-Features：還有 `.claude/rules/*.md` 加 `paths:`，按檔案類型或路徑載入 | **以官方為準**，04 補進去 |
| 5 | **CMD 的維護模式用 `/insights`** | CMD | 官方有 `/insights`（分析本機最近的 session，雲端不能用），也有 `/doctor`（修剪建議）與 `/doctor prompt-audit`（矛盾與過時） | **都留**：`/insights` 找反覆出錯的（新增），`/doctor prompt-audit` 找該刪的（修剪），正好對上 CMD 的「新增與修剪成對」 |
| 6 | **skill 名字裡的 `claude`** | CC-Skills：只保留 `synced`、`anthropic-skills` | BP：`name` 不能有 `anthropic`、`claude` | **Claude Code 內用不受影響**（`claude-md` 照常載入）。只有要上傳 claude.ai／API 時才要改名。04 記一句即可，不必改 |
| 7 | **用哪些模型測** | BP：Haiku、Sonnet、Opus 都測 | 這個使用者的 Claude Code 預設是 Opus（`~/.claude/settings.json`） | 〔判斷〕**只測實際會跑的模型**。subagent 若指定別的模型（例如 Explore 用較小的）才一起測 |
| 8 | **禁止句** | WFA：禁止句會讓被禁止的行為更容易出現，改寫成正向 | CC-Memory、CC-Features：CLAUDE.md 放「never do X」是正常用法 | **兩個都對**：能寫成正向的寫正向；真正的硬護欄保留禁止句，但同時配 hook（M9）。本 repo `CLAUDE.md` 的「絕對不寫入國王日記」屬於後者，該考慮加 hook（不在這一輪） |
| 9 | **參考檔多長要目錄** | skill-creator：>300 行 | BP：>100 行 | **以 BP（較嚴）為準** |
| 10 | **評估檔的格式** | skill-creator：`evals/<案例>/`（`prompt.md`、`case.yaml`、`graders/`），`claude plugin eval` 讀得懂 | Eval：`evals/evals.json` 一個檔 | skill-creator 說兩種都算、舊格式不要改。**新寫的用 skill-creator 的資料夾格式**（之後可以接 `claude plugin eval`） |
| 11 | **description 的人稱** | BP：第三人稱，不寫「我／你」 | `kickoff`、`claude-md` 的 description 是對 Claude 下指令（「一定要使用這個 skill」） | 〔判斷〕中文沒有嚴格的人稱，但同意 BP 的精神：**描述 skill 本身與觸發情境**，不要命令句。跟衝突 1 一起改 |

---

## 四、套到這個 repo 現在的 skill（2026-10-28 量的，給 03～05 起頭）

量法：description 用 Python 算字數（多行 YAML 的 firebase 那幾支顯示成 2，不準，略過）；行數是 `SKILL.md` 全檔。

| skill | description 字數 | 行數 | 模型能叫 | 要看的 |
|---|---|---|---|---|
| `kickoff` | 579 | 125 | 是 | B4、B8（「一定要…就算…也一樣」）；衝突 1、11。改的時候先做 G3（舊版 vs 新版）＋G6（觸發測試） |
| `claude-md` | 323 | 68 | 是 | 衝突 1、3、4、5；名字有 `claude`（衝突 6，不用改） |
| `impeccable` | 591 | 87 | 是 | 最長的 description；05 看跟 `frontend-design`（帳號那邊）重不重疊 |
| `graphify` | 357 | **793** | 是 | **超過 D1 的 500 行**（上游的，不改，記在 05） |
| `firestore-rules-creation` | — | **600** | 是 | **超過 500 行**（上游的，不改，記在 05） |
| `matt-code-review` | 421 | 89 | 是 | 05：跟內建 `/code-review` 的分工 |
| Matt 的 `grill-with-docs`、`to-spec`、`to-tickets`、`implement`、`handoff`、`wayfinder` | 62～247 | 7～128 | **否**（`disable-model-invocation: true`） | 寫法參考：一句給人看的 description、正文很短、靠叫別的 skill 組合（`grill-with-docs` 只有一行：叫 `grilling` 與 `domain-modeling`） |

**Matt 這套的寫法（給 03 參考）**：

- 流程型的全都關掉模型呼叫，description 一句話（C1、C2）。
- 用**組合**取代重寫：`grill-with-docs` 只叫兩支 skill；`implement` 叫 `tdd` 與 `matt-code-review`。同一件事只寫在一支（E4）。
- `handoff` 不重複已經在 spec／issue／commit 裡的東西，用路徑指過去（E4）；交接檔放系統暫存資料夾，不放 workspace。
- 用少數幾個**有既有含義的詞**撐住一整塊行為（*tracer bullets*、*fog of war*）—— WFA 的 leading words。
- 共用的參考放在 skill 外的普通檔（`docs/agents/*.md`），由各 skill 指過去（C5）。

---

## 判準自查

- 每一條都有可點的官方出處，或標了〔判斷〕：是（第一、二節每列有標記；第三節每個衝突寫了兩邊的出處）。
- 03、04 能逐條打勾：第一節 A～H 與第二節 M1～M18 每條有「怎麼查」或是一句可以直接判斷的問題；第四節給了起點。

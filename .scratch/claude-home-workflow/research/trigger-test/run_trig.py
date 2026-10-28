"""Trigger test (skill-checklist G6): which skill does a fresh session reach for?

Usage: python run_trig.py <variant-dir> <out.jsonl>
Runs each query once with `claude -p`, user settings and hooks off, and records every Skill tool call.
"""
import json, subprocess, sys, time, shutil

QUERIES = [
    ("K", "這一輪要加預算功能和固定支出，還有帳戶總覽要能看到信用卡未出帳的金額"),
    ("K", "這一輪要改的東西比較多：記一筆的畫面要能選分類、轉帳要能填手續費、收件匣要能一次確認好幾筆，幫我開 issue 然後分段"),
    ("K", "段 2 做完了，給我下一段的開場"),
    ("K", "收件匣合併通知的規則要改：刷卡通知跟出帳通知要合成一筆，對帳畫面也要顯示差額。先跟我解釋為什麼當初這樣設計"),
    ("K", "接下來要把發票載具接進來，還要順便改事件的資料形狀讓它能掛多個效果，這一輪你規劃一下"),
    ("G", "我們來討論一下記帳的資料要怎麼存"),
    ("G", "我還在想帳戶跟錢包到底要不要分開，你可以一直問我問題直到我們想清楚嗎"),
    ("G", "主畫面打開第一眼要看到什麼我還沒想好，幫我想想怎樣比較合理"),
    ("G", "「事件」跟「效果」這兩個詞我們好像用得很亂，來把它講清楚"),
    ("C", "CLAUDE.md 越來越肥了，幫我瘦身"),
    ("C", "Claude 一直忘記專案規則，每次都要我重講一次轉帳不是支出"),
    ("C", "剛跑完 /init，幫我把產出的規則檔整理一下"),
    ("N", "記一筆的存檔按鈕在手機上被鍵盤擋住了，幫我修"),
    ("N", "幫我把 README 的錯字改一改"),
    ("N", "幫我寫這個 PR 的說明"),
    ("N", "docs/plan.md 的階段表幫我加一列「之後：匯出 CSV」"),
]

DENY = "Bash PowerShell Edit Write NotebookEdit Agent WebFetch WebSearch"


def run(cwd, q):
    cmd = [shutil.which("claude"), "-p", q, "--output-format", "stream-json", "--verbose",
           "--model", "opus", "--max-turns", "3", "--setting-sources", "project",
           "--settings", json.dumps({"disableAllHooks": True}), "--strict-mcp-config",
           "--no-session-persistence", "--disallowedTools", DENY]
    t = time.time()
    p = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, encoding="utf-8", timeout=300)
    skills, tools = [], []
    for line in p.stdout.splitlines():
        try:
            ev = json.loads(line)
        except ValueError:
            continue
        if ev.get("type") != "assistant":
            continue
        for c in ev.get("message", {}).get("content", []):
            if c.get("type") == "tool_use":
                tools.append(c["name"])
                if c["name"] == "Skill":
                    skills.append(c["input"].get("skill"))
    return {"skills": skills, "tools": tools, "secs": round(time.time() - t), "rc": p.returncode,
            "err": p.stderr[-300:] if p.returncode else ""}


def main():
    cwd, out = sys.argv[1], sys.argv[2]
    with open(out, "w", encoding="utf-8") as f:
        for cat, q in QUERIES:
            try:
                r = run(cwd, q)
            except subprocess.TimeoutExpired:
                r = {"skills": [], "tools": [], "secs": 300, "rc": "timeout", "err": ""}
            r.update(cat=cat, q=q)
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
            f.flush()


if __name__ == "__main__":
    main()

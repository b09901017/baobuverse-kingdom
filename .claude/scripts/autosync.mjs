// SessionStart／SessionEnd hook（.claude/settings.json）：客廳在，就在背景叫客廳的同步工具，自己馬上結束。
// 同步什麼、怎麼同步在客廳的 tools/autosync.mjs（記憶與交接開場 → .local/，~/.claude/mods → 客廳）。
// 客廳不在（雲端 session、還沒接客廳的電腦）就什麼都不做。永遠 exit 0，不卡住 Claude Code。
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const tool = join(homedir(), 'claude-home', 'tools', 'autosync.mjs')

if (existsSync(tool)) {
  try {
    spawn(process.execPath, [tool, '--project', project, '--worker'], { detached: true, stdio: 'ignore', windowsHide: true }).unref()
  } catch {
    // 開不起來就算了，下一次 session 開始或結束會再試
  }
}
process.exit(0)

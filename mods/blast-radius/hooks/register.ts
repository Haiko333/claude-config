import type { Register } from 'claude-code'

type Rule = { name: string; match: RegExp; preview?: (cmd: string) => string[] }

const PREVIEW_LINES = 15
const PROCEED = 'Proceed'
const CANCEL = 'Cancel'

// shortcut: naive split on spaces, ignores quoting; upgrade if previews mislead.
export const rmTargets = (cmd: string): string[] => {
  const m = cmd.match(/\brm\s+([^;&|]*)/)
  return m?.[1] ? m[1].trim().split(/\s+/).filter(a => a && !a.startsWith('-')) : []
}

// Leading `cd <dir> &&` sets where the preview runs; `~` is left to the shell, so it is skipped.
export const leadingCd = (cmd: string): string | undefined => {
  const dir = cmd.match(/^\s*cd\s+(?:"([^"]+)"|'([^']+)'|([^\s;&|]+))\s*&&/)
  const d = dir && (dir[1] ?? dir[2] ?? dir[3])
  return d && !d.startsWith('~') ? d : undefined
}

export const RULES: Rule[] = [
  {
    name: 'rm -r',
    match: /\brm\s+(-\w*[rR]\w*|--recursive)\b/,
    preview: cmd => ['du', '-sh', '--', ...rmTargets(cmd)],
  },
  { name: 'git reset --hard', match: /\bgit\s+reset\b.*--hard/, preview: () => ['git', 'status', '--short'] },
  { name: 'git clean', match: /\bgit\s+clean\b.*-\w*f/, preview: () => ['git', 'clean', '-nd'] },
  {
    name: 'git push --force',
    match: /\bgit\s+push\b.*(--force\b|--force-with-lease\b|\s-\w*f\b|\s\+\S)/,
    preview: () => ['git', 'log', '--oneline', 'HEAD..@{u}'],
  },
  { name: 'git checkout/restore .', match: /\bgit\s+(checkout|restore)\s+(--\s+)?\.(\s|$)/, preview: () => ['git', 'diff', '--stat'] },
  { name: 'SQL DROP/TRUNCATE', match: /\b(drop\s+(table|database|schema)|truncate\s+table)\b/i },
  { name: 'DB migration', match: /\b(migrate|migration)\b.*\b(up|reset|fresh|deploy|rollback|down)\b|\bprisma\s+migrate\b|\bdb\s+push\b/i },
]

export const findRule = (cmd: string): Rule | undefined => RULES.find(r => r.match.test(cmd))

const trimLines = (text: string): string => {
  const lines = text.trim().split('\n')
  const extra = lines.length - PREVIEW_LINES
  return extra > 0 ? `${lines.slice(0, PREVIEW_LINES).join('\n')}\n… +${extra} more` : lines.join('\n')
}

export const register: Register = on => {
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const rule = findRule(e.command)
    if (!rule) return next(e)

    let impact = '(no preview)'
    if (rule.preview) {
      const argv = rule.preview(e.command)
      const r = await $.process.run(argv, { cwd: leadingCd(e.command), timeoutMs: 5000 }).catch(() => undefined)
      const out = r ? (r.stdout || r.stderr).trim() : ''
      impact = out ? `${argv.join(' ')}:\n${trimLines(out)}` : `${argv.join(' ')}: nothing reported`
    }

    const answer = await $.ui
      .ask(`⚠ ${rule.name}\n\n$ ${e.command}\n\n${impact}\n\nRun it?`, { header: 'Risky', options: [PROCEED, CANCEL] })
      .catch(() => CANCEL)

    return answer === PROCEED ? next(e) : { deny: `${$.plugin.name}: the user cancelled this ${rule.name}.` }
  }).catch(($, e, next) => (next.called ? next(e) : { deny: `${$.plugin.name}: its guard failed.` }))
}

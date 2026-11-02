import type { Register } from 'claude-code'

const PLACEHOLDER = '[REDACTED:'

// Most specific first: a later pattern never sees what an earlier one replaced.
const PATTERNS: ReadonlyArray<readonly [string, RegExp]> = [
  ['private-key', /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g],
  ['anthropic-key', /\bsk-ant-[A-Za-z0-9_-]{20,}/g],
  ['openai-key', /\bsk-(proj-)?[A-Za-z0-9_-]{20,}/g],
  ['stripe-key', /\b[sr]k_(live|test)_[A-Za-z0-9]{16,}/g],
  ['github-token', /\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})/g],
  ['aws-key', /\b(AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ['google-key', /\bAIza[A-Za-z0-9_-]{35}\b/g],
  ['slack-token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/g],
  ['jwt', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g],
  ['url-password', /(?<=[a-z][a-z0-9+.-]*:\/\/[^\s:/@]+:)[^\s@/]+(?=@)/gi],
]

// `NAME_TOKEN=value` / `password: value`: keeps the name, hides the value.
const ASSIGNMENT = /\b([A-Za-z0-9_]*(?:SECRET|TOKEN|PASSWORD|PASSWD|API_?KEY|PRIVATE_KEY)[A-Za-z0-9_]*)(\s*[:=]\s*)(["']?)([^\s"']{6,})\3/gi
const EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
const KEPT_EMAIL = /noreply|no-reply|example\.(com|org)/i
const IPV4 = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g
// Loopback, private, link-local and unspecified ranges stay: they are dev noise, not leaks.
const LOCAL_IP = /^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.)/

const tag = (kind: string): string => `${PLACEHOLDER}${kind}]`

export const redact = (text: string): string => {
  let out = PATTERNS.reduce((acc, [kind, re]) => acc.replace(re, tag(kind)), text)
  out = out.replace(ASSIGNMENT, (whole, name, sep, q, value) =>
    value.startsWith(PLACEHOLDER) || value.startsWith('$') ? whole : `${name}${sep}${q}${tag('secret')}${q}`,
  )
  out = out.replace(EMAIL, m => (KEPT_EMAIL.test(m) ? m : tag('email')))
  return out.replace(IPV4, m => (LOCAL_IP.test(m) ? m : tag('ip')))
}

export const redactDeep = (value: unknown): unknown => {
  if (typeof value === 'string') return redact(value)
  if (Array.isArray(value)) return value.map(redactDeep)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redactDeep(v)]))
  }
  return value
}

const WRITE_TOOLS = new Set(['Write', 'Edit', 'NotebookEdit'])

export const register: Register = on => {
  on('tool.call', async ($, e, next) => {
    // A placeholder written back to disk would replace the real secret: refuse it.
    if (WRITE_TOOLS.has(e.tool) && JSON.stringify(e).includes(PLACEHOLDER)) {
      return { deny: `${$.plugin.name}: this edit contains a ${PLACEHOLDER}…] placeholder; the real value is hidden from you. Ask the user to make this change.` }
    }

    const ran = await next(e)
    if (ran.deny !== undefined) return ran

    const seen = ran.text ?? JSON.stringify(ran.result ?? '')
    if (redact(seen) === seen) return ran

    $.ui.status(`🔒 ${e.tool}: secrets redacted`)
    // An errored result's own shape is not ours to rebuild: withhold it and pass the redacted text.
    if (ran.isError) return { deny: redact(ran.text ?? String(ran.result)) }
    return { result: redactDeep(ran.result) as typeof ran.result, context: ran.context }
  }).catch(($, e, next) => (next.called ? { deny: `${$.plugin.name}: redaction failed, result withheld.` } : next(e)))
}

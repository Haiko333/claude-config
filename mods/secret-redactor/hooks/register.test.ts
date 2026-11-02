import { expect, test } from 'claude-code/testing'
import { redact } from './register'

// Fake values, assembled so secret scanners do not flag this file.
const FAKE_OPENAI = 'sk-' + 'proj-' + 'a'.repeat(30)
const FAKE_GH = 'ghp_' + 'b'.repeat(36)

test('replaces keys, assignments, emails and public IPs', async () => {
  expect(redact(`key ${FAKE_OPENAI} end`)).toBe('key [REDACTED:openai-key] end')
  expect(redact(FAKE_GH)).toBe('[REDACTED:github-token]')
  expect(redact('DB_PASSWORD=hunter2hunter2')).toBe('DB_PASSWORD=[REDACTED:secret]')
  expect(redact('API_KEY="${API_KEY}"')).toBe('API_KEY="${API_KEY}"')
  expect(redact('postgres://me:s3cretpw@db.host/x')).toBe('postgres://me:[REDACTED:url-password]@db.host/x')
  expect(redact('mail bob@corp.io')).toBe('mail [REDACTED:email]')
  expect(redact('noreply@anthropic.com')).toBe('noreply@anthropic.com')
  expect(redact('8.8.8.8 and 192.168.1.4')).toBe('[REDACTED:ip] and 192.168.1.4')
  expect(redact('plain text, version 1.2.3')).toBe('plain text, version 1.2.3')
})

test('redacts a tool result and refuses writing placeholders back', async ($, on) => {
  on('ui.status', () => ({ value: undefined }))
  on('tool.call', { tool: 'Bash' }, () => ({ result: { stdout: `TOKEN=${FAKE_GH}`, stderr: '' } }))
  on('tool.call', { tool: 'Write' }, () => ({ result: {} }))
  const r = await $.tool.call({ tool: 'Bash', command: 'cat .env' })
  expect(JSON.stringify(r.result)).toContain('[REDACTED:')
  expect(JSON.stringify(r.result)).not.toContain(FAKE_GH)

  const w = await $.tool.call({ tool: 'Write', file_path: '/x/.env', content: 'TOKEN=[REDACTED:secret]' })
  expect(typeof w.deny).toBe('string')
})

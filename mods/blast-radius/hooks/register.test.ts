import { expect, test } from 'claude-code/testing'
import { findRule, leadingCd, rmTargets } from './register'

test('flags risky commands and lets safe ones pass', async () => {
  expect(findRule('rm -rf node_modules dist')?.name).toBe('rm -r')
  expect(findRule('git reset --hard HEAD~1')?.name).toBe('git reset --hard')
  expect(findRule('git push -f origin main')?.name).toBe('git push --force')
  expect(findRule('git clean -fd')?.name).toBe('git clean')
  expect(findRule('psql -c "DROP TABLE users"')?.name).toBe('SQL DROP/TRUNCATE')
  expect(findRule('rm file.txt')).toBe(undefined)
  expect(findRule('git push origin main')).toBe(undefined)
  expect(findRule('ls -la')).toBe(undefined)
  expect(leadingCd('cd /tmp/x && git clean -fd')).toBe('/tmp/x')
  expect(leadingCd('cd "a b" && rm -r c')).toBe('a b')
  expect(leadingCd('git clean -fd')).toBe(undefined)
  expect(rmTargets('rm -rf a b && ls')).toEqual(['a', 'b'])
})

test('cancel denies, proceed runs', async ($, on) => {
  let answer = 'Cancel'
  on('process.run', () => ({ value: { exitCode: 0, stdout: '4K a', stderr: '' } }))
  on('tool.call', { tool: 'AskUserQuestion' }, (_, e) => ({
    result: { questions: e.questions, answers: { [e.questions[0].question]: answer } },
  }))
  on('tool.call', { tool: 'Bash' }, () => ({ result: {} }))
  const denied = await $.tool.call({ tool: 'Bash', command: 'rm -rf a' })
  expect(typeof denied.deny).toBe('string')
  answer = 'Proceed'
  const ran = await $.tool.call({ tool: 'Bash', command: 'rm -rf a' })
  expect(ran.deny).toBe(undefined)
})
